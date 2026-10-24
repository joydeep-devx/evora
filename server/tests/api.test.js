/**
 * Integration tests against an isolated test database (see helpers/harness.js).
 * Assertions describe the *correct* behaviour; a failing test is a finding.
 *
 * The "shimmed" suite at the bottom works around two crash bugs WITHOUT editing app code, so the
 * logic behind them can be exercised too:
 *   - global.Booking = Booking model  (booking.controller references an undeclared `Booking`)
 *   - Event.prototype.price -> ticketPrice  (bookEvent reads a non-existent `event.price`)
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const h = require('./helpers/harness');
const { api, mailer, makeUser, loginAs, makeEvent, makeBooking, eventData, User, Event, Booking, OTP } = h;

let db;
let skip = false;
before(async () => {
  db = await h.connectTestDb();
  if (!db.ok) { skip = db.reason; return; }
  await h.startServer();
});
after(async () => {
  await h.stopServer();
  if (db && db.ok) await db.teardown();
});
// node:test evaluates `skip` at definition time, so check at run time instead.
const t = (name, fn) => it(name, async (ctx) => { if (skip) return ctx.skip(skip); await fn(ctx); });

const fakeId = '64b0000000000000000000ff';

// ============================================================================
describe('Auth: register', () => {
  t('A1 valid registration -> 201, password hashed, unverified, OTP emailed, no password in response', async () => {
    const email = `reg_${h.uid()}@evora.test`;
    const res = await api('POST', '/api/auth/register', { body: { username: 'reg', email, password: 'Str0ngPass!' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.password, undefined);
    const u = await User.findOne({ email });
    assert.match(u.password, /^\$2[aby]\$/);
    assert.notEqual(u.password, 'Str0ngPass!');
    assert.equal(u.isVerified, false);
    assert.match(mailer.lastOtpFor(email), /^\d{6}$/);
  });

  t('A2 duplicate email -> 400', async () => {
    const { email } = await makeUser();
    const res = await api('POST', '/api/auth/register', { body: { username: 'x', email, password: 'Str0ngPass!' } });
    assert.equal(res.status, 400);
  });

  t('A3 missing password -> 400 (not 500)', async () => {
    const res = await api('POST', '/api/auth/register', { body: { username: 'x', email: `m_${h.uid()}@evora.test` } });
    assert.equal(res.status, 400);
  });

  t('A4 missing email/username -> 400 (not 500)', async () => {
    const res = await api('POST', '/api/auth/register', { body: { password: 'Str0ngPass!' } });
    assert.equal(res.status, 400);
  });

  t('A5 malformed email -> 400', async () => {
    const res = await api('POST', '/api/auth/register', { body: { username: 'x', email: `bad_${h.uid()}`, password: 'Str0ngPass!' } });
    assert.equal(res.status, 400);
  });

  t('A6 trivially weak password ("1") -> 400', async () => {
    const res = await api('POST', '/api/auth/register', { body: { username: 'x', email: `w_${h.uid()}@evora.test`, password: '1' } });
    assert.equal(res.status, 400);
  });

  t('A7 role/isVerified in body are ignored (no mass assignment)', async () => {
    const email = `ma_${h.uid()}@evora.test`;
    await api('POST', '/api/auth/register', { body: { username: 'x', email, password: 'Str0ngPass!', role: 'admin', isVerified: true } });
    const u = await User.findOne({ email });
    assert.equal(u.role, 'user');
    assert.equal(u.isVerified, false);
  });

  t('A8 same email in different case is treated as a duplicate', async () => {
    const base = `case_${h.uid()}@evora.test`;
    await makeUser({ email: base });
    const res = await api('POST', '/api/auth/register', { body: { username: 'x', email: base.toUpperCase(), password: 'Str0ngPass!' } });
    assert.equal(res.status, 400);
  });

  t('A9 NoSQL operator in email is rejected', async () => {
    const res = await api('POST', '/api/auth/register', { body: { username: 'x', email: { $gt: '' }, password: 'Str0ngPass!' } });
    assert.equal(res.status, 400);
  });

  t('A10 email delivery failure does not leave an orphaned account that blocks re-registration', async () => {
    const email = `fail_${h.uid()}@evora.test`;
    mailer.fail = true;
    try { await api('POST', '/api/auth/register', { body: { username: 'x', email, password: 'Str0ngPass!' } }); }
    finally { mailer.fail = false; }
    const retry = await api('POST', '/api/auth/register', { body: { username: 'x', email, password: 'Str0ngPass!' } });
    assert.equal(retry.status, 201, `retry got ${retry.status}: ${retry.text}`);
  });
});

// ============================================================================
describe('Auth: login', () => {
  t('L1 valid verified login -> 200 with JWT, no password', async () => {
    const u = await makeUser();
    const res = await api('POST', '/api/auth/login', { body: { email: u.email, password: u.password } });
    assert.equal(res.status, 200);
    assert.equal(res.body.password, undefined);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(decoded.id, String(u.user._id));
  });

  t('L2 wrong password -> 4xx, no token', async () => {
    const u = await makeUser();
    const res = await api('POST', '/api/auth/login', { body: { email: u.email, password: 'wrong' } });
    assert.ok(res.status === 400 || res.status === 401);
    assert.equal(res.body.token, undefined);
  });

  t('L3 unknown email and wrong password give the same response (no user enumeration)', async () => {
    const u = await makeUser();
    const a = await api('POST', '/api/auth/login', { body: { email: `nobody_${h.uid()}@evora.test`, password: 'x' } });
    const b = await api('POST', '/api/auth/login', { body: { email: u.email, password: 'x' } });
    assert.deepEqual([a.status, a.body], [b.status, b.body]);
  });

  t('L4 missing fields -> 400 (not 500)', async () => {
    await makeUser();
    const res = await api('POST', '/api/auth/login', { body: {} });
    assert.equal(res.status, 400);
  });

  t('L5 NoSQL injection in email ({$ne:null}) does not log in as another user', async () => {
    // Attacker knows a common password but no email address.
    const victim = await makeUser({ password: 'CommonPass1' });
    const res = await api('POST', '/api/auth/login', {
      body: { email: { $regex: `^${victim.email.split('@')[0]}` }, password: 'CommonPass1' },
    });
    assert.notEqual(res.status, 200, 'operator injection in email yielded a token');
  });

  t('L6 unverified user -> rejected, new OTP sent, previous OTP invalidated', async () => {
    const u = await makeUser({ isVerified: false });
    await OTP.create({ email: u.email, otp: '111111', action: 'account_verification' });
    const res = await api('POST', '/api/auth/login', { body: { email: u.email, password: u.password } });
    assert.ok(res.status >= 400 && res.status < 500);
    assert.equal(res.body.token, undefined);
    assert.equal(await OTP.countDocuments({ email: u.email, otp: '111111' }), 0);
    assert.match(mailer.lastOtpFor(u.email), /^\d{6}$/);
  });

  t('L7 brute-force / rate limiting: 25 rapid failed logins eventually return 429', async () => {
    const u = await makeUser();
    const statuses = [];
    for (let i = 0; i < 25; i++) {
      statuses.push((await api('POST', '/api/auth/login', { body: { email: u.email, password: `bad${i}` } })).status);
    }
    assert.ok(statuses.includes(429), `statuses: ${[...new Set(statuses)]}`);
  });

  t('L8 token for a deleted user -> 401', async () => {
    const u = await loginAs();
    await User.deleteOne({ _id: u.user._id });
    assert.equal((await api('GET', '/api/events', { token: u.token })).status, 401);
  });

  t('L9 role is read from DB, not the token: demoted admin loses access immediately', async () => {
    const a = await loginAs({ role: 'admin' });
    await User.updateOne({ _id: a.user._id }, { role: 'user' });
    assert.equal((await api('POST', '/api/events', { token: a.token, body: eventData() })).status, 403);
  });
});

// ============================================================================
describe('Auth: verify-otp', () => {
  async function pending() {
    const u = await makeUser({ isVerified: false });
    await OTP.create({ email: u.email, otp: '424242', action: 'account_verification' });
    return u;
  }

  t('V1 correct OTP -> 200, user verified, OTP consumed, token issued', async () => {
    const u = await pending();
    const res = await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: '424242' } });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal((await User.findById(u.user._id)).isVerified, true);
    assert.equal(await OTP.countDocuments({ email: u.email }), 0);
  });

  t('V2 wrong OTP -> 400', async () => {
    const u = await pending();
    assert.equal((await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: '000000' } })).status, 400);
  });

  t('V3 OTP cannot be replayed after successful use', async () => {
    const u = await pending();
    await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: '424242' } });
    assert.equal((await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: '424242' } })).status, 400);
  });

  t('V4 OTP older than 5 minutes is rejected immediately (not only when the TTL sweeper runs)', async () => {
    const u = await makeUser({ isVerified: false });
    await OTP.create({ email: u.email, otp: '515151', action: 'account_verification', createdAt: new Date(Date.now() - 10 * 60e3) });
    const res = await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: '515151' } });
    assert.equal(res.status, 400);
  });

  t('V5 booking OTP cannot verify an account (purpose separation)', async () => {
    const u = await makeUser({ isVerified: false });
    await OTP.create({ email: u.email, otp: '616161', action: 'event_booking' });
    assert.equal((await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: '616161' } })).status, 400);
  });

  t('V6 [SECURITY] NoSQL injection in otp ({$ne:...}) does not verify the account', async () => {
    const u = await pending();
    const res = await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: { $ne: '000000' } } });
    assert.equal(res.status, 400, `got ${res.status}, token issued: ${Boolean(res.body && res.body.token)}`);
  });

  t('V7 [SECURITY] NoSQL injection in email+otp cannot mint a token for a different (admin) user', async () => {
    // An admin exists; an attacker registers their own account so that *some* verification OTP exists.
    const adminUser = await makeUser({ role: 'admin', email: `aaaa_admin_${h.uid()}@evora.test` });
    const attacker = await pending();
    const res = await api('POST', '/api/auth/verify-otp', {
      body: { email: { $in: [adminUser.email, attacker.email] }, otp: { $ne: null } },
    });
    if (res.status === 200) {
      const who = await User.findById(res.body._id);
      assert.fail(`token issued for ${who.role} user ${who.email === adminUser.email ? '(the ADMIN)' : '(attacker)'}`);
    }
    assert.equal(res.status, 400);
  });

  t('V8 brute force: 20 wrong guesses lock out the OTP (correct OTP afterwards is refused or 429)', async () => {
    const u = await pending();
    for (let i = 0; i < 20; i++) await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: String(100000 + i) } });
    const res = await api('POST', '/api/auth/verify-otp', { body: { email: u.email, otp: '424242' } });
    assert.notEqual(res.status, 200, 'no attempt limit on 6-digit OTP');
  });

  t('V9 OTP for an email with no user account -> 4xx (not 500)', async () => {
    const email = `ghost_${h.uid()}@evora.test`;
    await OTP.create({ email, otp: '717171', action: 'account_verification' });
    const res = await api('POST', '/api/auth/verify-otp', { body: { email, otp: '717171' } });
    assert.ok(res.status >= 400 && res.status < 500, `got ${res.status}`);
  });

  t('V10 missing body fields -> 400', async () => {
    assert.equal((await api('POST', '/api/auth/verify-otp', { body: {} })).status, 400);
  });
});

// ============================================================================
describe('Events', () => {
  let admin, user;
  before(async () => { if (skip) return; admin = await loginAs({ role: 'admin' }); user = await loginAs(); });

  t('E1 list events as authenticated user -> 200 array', async () => {
    await makeEvent(admin.user._id);
    const res = await api('GET', '/api/events', { token: user.token });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body) && res.body.length >= 1);
  });

  t('E2 ?category filter is applied', async () => {
    const cat = `Cat_${h.uid()}`;
    await makeEvent(admin.user._id, { category: cat });
    await makeEvent(admin.user._id, { category: 'Other' });
    const res = await api('GET', `/api/events?category=${cat}`, { token: user.token });
    assert.ok(res.body.length >= 1 && res.body.every((e) => e.category === cat), `returned ${res.body.length} events of mixed categories`);
  });

  t('E3 get by id -> 200; nonexistent id -> 404', async () => {
    const ev = await makeEvent(admin.user._id);
    assert.equal((await api('GET', `/api/events/${ev._id}`, { token: user.token })).status, 200);
    assert.equal((await api('GET', `/api/events/${fakeId}`, { token: user.token })).status, 404);
  });

  t('E4 malformed id -> 400 (not 500)', async () => {
    assert.equal((await api('GET', '/api/events/not-an-id', { token: user.token })).status, 400);
  });

  t('E5 admin creates event -> 201, availableSeats=totalSeats, createdBy=admin, body availableSeats ignored', async () => {
    const res = await api('POST', '/api/events', { token: admin.token, body: eventData({ totalSeats: 7, availableSeats: 999 }) });
    assert.equal(res.status, 201);
    assert.equal(res.body.availableSeats, 7);
    assert.equal(res.body.createdBy, String(admin.user._id));
  });

  t('E6 regular user cannot create/update/delete events -> 403', async () => {
    const ev = await makeEvent(admin.user._id);
    assert.equal((await api('POST', '/api/events', { token: user.token, body: eventData() })).status, 403);
    assert.equal((await api('PUT', `/api/events/${ev._id}`, { token: user.token, body: { title: 'x' } })).status, 403);
    assert.equal((await api('DELETE', `/api/events/${ev._id}`, { token: user.token })).status, 403);
  });

  t('E7 missing required field (title) -> 400 (not 500)', async () => {
    const d = eventData(); delete d.title;
    assert.equal((await api('POST', '/api/events', { token: admin.token, body: d })).status, 400);
  });

  t('E8 imageUrl is optional as the controller intends (defaults to "") -> 201', async () => {
    const d = eventData(); delete d.imageUrl;
    const res = await api('POST', '/api/events', { token: admin.token, body: d });
    assert.equal(res.status, 201, `got ${res.status}`);
  });

  t('E9 negative totalSeats -> 400', async () => {
    assert.equal((await api('POST', '/api/events', { token: admin.token, body: eventData({ totalSeats: -3 }) })).status, 400);
  });

  t('E10 non-numeric totalSeats -> 400 (not 500)', async () => {
    assert.equal((await api('POST', '/api/events', { token: admin.token, body: eventData({ totalSeats: 'abc' }) })).status, 400);
  });

  t('E11 admin update title -> 200; nonexistent -> 404', async () => {
    const ev = await makeEvent(admin.user._id);
    const res = await api('PUT', `/api/events/${ev._id}`, { token: admin.token, body: { title: 'Renamed' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Renamed');
    assert.equal((await api('PUT', `/api/events/${fakeId}`, { token: admin.token, body: { title: 'x' } })).status, 404);
  });

  t('E12 update cannot set availableSeats above totalSeats / below 0 or reassign createdBy (mass assignment)', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 10 });
    await api('PUT', `/api/events/${ev._id}`, { token: admin.token, body: { availableSeats: -5, createdBy: user.user._id } });
    const after = await Event.findById(ev._id);
    assert.ok(after.availableSeats >= 0 && after.availableSeats <= after.totalSeats, `availableSeats=${after.availableSeats}`);
    assert.equal(String(after.createdBy), String(admin.user._id));
  });

  t('E13 update with invalid type -> 400 (not 500)', async () => {
    const ev = await makeEvent(admin.user._id);
    assert.equal((await api('PUT', `/api/events/${ev._id}`, { token: admin.token, body: { totalSeats: 'abc' } })).status, 400);
  });

  t('E14 delete -> 200, then 404', async () => {
    const ev = await makeEvent(admin.user._id);
    assert.equal((await api('DELETE', `/api/events/${ev._id}`, { token: admin.token })).status, 200);
    assert.equal((await api('DELETE', `/api/events/${ev._id}`, { token: admin.token })).status, 404);
  });

  t('E15 deleting an event with bookings does not leave orphaned active bookings', async () => {
    const ev = await makeEvent(admin.user._id);
    await makeBooking(user.user._id, ev, { status: 'confirmed' });
    await api('DELETE', `/api/events/${ev._id}`, { token: admin.token });
    const active = await Booking.countDocuments({ eventId: ev._id, status: { $ne: 'cancelled' } });
    assert.equal(active, 0, `${active} active booking(s) now reference a deleted event`);
  });
});

// ============================================================================
describe('Bookings (unshimmed — real app behaviour)', () => {
  let admin, user, other;
  before(async () => {
    if (skip) return;
    admin = await loginAs({ role: 'admin' }); user = await loginAs(); other = await loginAs();
  });

  t('B1 send-otp -> 200, OTP stored with action event_booking and emailed', async () => {
    const res = await api('POST', '/api/bookings/send-otp', { token: user.token });
    assert.equal(res.status, 200);
    const otp = mailer.lastOtpFor(user.email);
    assert.ok(await OTP.findOne({ email: user.email, otp, action: 'event_booking' }));
  });

  t('B2 book with wrong OTP -> 400', async () => {
    const ev = await makeEvent(admin.user._id);
    await api('POST', '/api/bookings/send-otp', { token: user.token });
    assert.equal((await api('POST', '/api/bookings', { token: user.token, body: { eventId: ev._id, otp: '000000' } })).status, 400);
  });

  t('B3 book with valid OTP for a valid event -> 201 pending booking with amount = ticketPrice', async () => {
    const ev = await makeEvent(admin.user._id, { ticketPrice: 300 });
    await api('POST', '/api/bookings/send-otp', { token: user.token });
    const res = await api('POST', '/api/bookings', { token: user.token, body: { eventId: ev._id, otp: mailer.lastOtpFor(user.email) } });
    assert.equal(res.status, 201, `got ${res.status}: ${res.text}`);
    assert.equal(res.body.booking.amount, 300);
    assert.equal(res.body.booking.status, 'pending');
  });

  t('B4 nonexistent event -> 404; malformed eventId -> 400', async () => {
    await api('POST', '/api/bookings/send-otp', { token: user.token });
    const otp = mailer.lastOtpFor(user.email);
    assert.equal((await api('POST', '/api/bookings', { token: user.token, body: { eventId: fakeId, otp } })).status, 404);
    assert.equal((await api('POST', '/api/bookings', { token: user.token, body: { eventId: 'nope', otp } })).status, 400);
  });

  t('B5 sold-out event -> 400', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 1, availableSeats: 0 });
    await api('POST', '/api/bookings/send-otp', { token: user.token });
    const res = await api('POST', '/api/bookings', { token: user.token, body: { eventId: ev._id, otp: mailer.lastOtpFor(user.email) } });
    assert.equal(res.status, 400);
  });

  t('B6 [SECURITY] OTP operator injection ({$ne:""}) does not bypass booking OTP check', async () => {
    await api('POST', '/api/bookings/send-otp', { token: user.token });
    // With a nonexistent event: 400 = OTP check held, 404 = OTP check bypassed.
    const res = await api('POST', '/api/bookings', { token: user.token, body: { eventId: fakeId, otp: { $ne: '' } } });
    assert.equal(res.status, 400, `got ${res.status} -> OTP check was bypassed`);
  });

  t('B7 user sees only own bookings; populated data has no password', async () => {
    const ev = await makeEvent(admin.user._id);
    await makeBooking(user.user._id, ev);
    await makeBooking(other.user._id, ev);
    const res = await api('GET', '/api/bookings/my', { token: user.token });
    assert.equal(res.status, 200);
    assert.ok(res.body.bookings.length >= 1);
    assert.ok(res.body.bookings.every((b) => String(b.userId) === String(user.user._id)));
  });

  t('B8 admin sees all bookings with user username+email populated and no password', async () => {
    const ev = await makeEvent(admin.user._id);
    await makeBooking(other.user._id, ev);
    const res = await api('GET', '/api/bookings/my', { token: admin.token });
    assert.equal(res.status, 200);
    const b = res.body.bookings.find((x) => x.userId && x.userId._id === String(other.user._id));
    assert.ok(b);
    assert.equal(b.userId.password, undefined);
    assert.equal(b.userId.username, other.user.username, 'populate selects "name", which is not a User field');
  });

  t('B9 admin confirms a pending booking -> 200, status confirmed, seats decremented', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 5 });
    const b = await makeBooking(user.user._id, ev);
    const res = await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: { paymentStatus: 'paid' } });
    assert.equal(res.status, 200, `got ${res.status}: ${res.text}`);
    assert.equal((await Event.findById(ev._id)).availableSeats, 4);
  });

  t('B10 non-admin cannot confirm -> 403', async () => {
    const ev = await makeEvent(admin.user._id);
    const b = await makeBooking(user.user._id, ev);
    assert.equal((await api('PUT', `/api/bookings/${b._id}`, { token: user.token, body: {} })).status, 403);
  });

  t('B11 confirm nonexistent booking -> 404', async () => {
    assert.equal((await api('PUT', `/api/bookings/${fakeId}`, { token: admin.token, body: {} })).status, 404);
  });

  t('B12 user cancels own pending booking -> 200', async () => {
    const ev = await makeEvent(admin.user._id);
    const b = await makeBooking(user.user._id, ev);
    const res = await api('DELETE', `/api/bookings/${b._id}`, { token: user.token });
    assert.equal(res.status, 200, `got ${res.status}: ${res.text}`);
  });

  t('B13 user cannot cancel another user\'s booking -> 403 (IDOR)', async () => {
    const ev = await makeEvent(admin.user._id);
    const b = await makeBooking(other.user._id, ev);
    const res = await api('DELETE', `/api/bookings/${b._id}`, { token: user.token });
    assert.equal(res.status, 403, `got ${res.status}`);
    assert.equal((await Booking.findById(b._id)).status, 'pending');
  });

  t('B14 send-otp is rate-limited (10 rapid requests -> some 429)', async () => {
    const statuses = [];
    for (let i = 0; i < 10; i++) statuses.push((await api('POST', '/api/bookings/send-otp', { token: other.token })).status);
    assert.ok(statuses.includes(429), `statuses: ${[...new Set(statuses)]} — ${statuses.length} emails sent`);
  });
});

// ============================================================================
describe('Bookings (shimmed — logic behind the crash bugs)', () => {
  let admin, user, other;
  const hadPrice = Object.getOwnPropertyDescriptor(Event.prototype, 'price');
  before(async () => {
    if (skip) return;
    global.Booking = Booking;
    Object.defineProperty(Event.prototype, 'price', { configurable: true, get() { return this.ticketPrice; } });
    admin = await loginAs({ role: 'admin' }); user = await loginAs(); other = await loginAs();
  });
  after(() => {
    delete global.Booking;
    if (!hadPrice) delete Event.prototype.price;
  });

  async function book(u, ev) {
    await api('POST', '/api/bookings/send-otp', { token: u.token });
    return api('POST', '/api/bookings', { token: u.token, body: { eventId: ev._id, otp: mailer.lastOtpFor(u.email) } });
  }

  t('S1 booking succeeds and the OTP is single-use', async () => {
    const ev = await makeEvent(admin.user._id);
    await api('POST', '/api/bookings/send-otp', { token: user.token });
    const otp = mailer.lastOtpFor(user.email);
    const r1 = await api('POST', '/api/bookings', { token: user.token, body: { eventId: ev._id, otp } });
    assert.equal(r1.status, 201);
    const ev2 = await makeEvent(admin.user._id);
    const r2 = await api('POST', '/api/bookings', { token: user.token, body: { eventId: ev2._id, otp } });
    assert.equal(r2.status, 400);
  });

  t('S2 duplicate active booking for the same event is rejected', async () => {
    const ev = await makeEvent(admin.user._id);
    assert.equal((await book(user, ev)).status, 201);
    const r2 = await book(user, ev);
    assert.equal(r2.status, 400, `got ${r2.status}; bookings now: ${await Booking.countDocuments({ userId: user.user._id, eventId: ev._id })}`);
  });

  t('S3 duplicate check is per-user (does not block a different user)', async () => {
    const ev = await makeEvent(admin.user._id);
    await makeBooking(other.user._id, ev);
    assert.equal((await book(user, ev)).status, 201);
  });

  t('S4 confirm -> 200, seats -1, paymentStatus paid, confirmation email greets user by username', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 3 });
    const b = await makeBooking(user.user._id, ev);
    const res = await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: { paymentStatus: 'paid' } });
    assert.equal(res.status, 200);
    const fresh = await Booking.findById(b._id);
    assert.equal(fresh.status, 'confirmed');
    assert.equal(fresh.paymentStatus, 'paid');
    assert.equal((await Event.findById(ev._id)).availableSeats, 2);
    const mail = mailer.lastTo(user.email);
    assert.match(mail.subject, /Booking Confirmation/);
    assert.ok(mail.html.includes(user.user.username), `email says: ${mail.html.match(/Hi [^<]*/)}`);
  });

  t('S5 confirming twice -> 400 and seats only decremented once', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 3 });
    const b = await makeBooking(user.user._id, ev);
    await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: {} });
    assert.equal((await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: {} })).status, 400);
    assert.equal((await Event.findById(ev._id)).availableSeats, 2);
  });

  t('S6 invalid paymentStatus -> 400', async () => {
    const ev = await makeEvent(admin.user._id);
    const b = await makeBooking(user.user._id, ev);
    assert.equal((await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: { paymentStatus: 'bogus' } })).status, 400);
  });

  t('S7 paymentStatus "not_paid" (accepted by controller) -> handled cleanly, not 500', async () => {
    const ev = await makeEvent(admin.user._id);
    const b = await makeBooking(user.user._id, ev);
    const res = await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: { paymentStatus: 'not_paid' } });
    assert.notEqual(res.status, 500);
  });

  t('S8 a cancelled booking cannot be confirmed', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 3 });
    const b = await makeBooking(user.user._id, ev, { status: 'cancelled' });
    const res = await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: {} });
    assert.equal(res.status, 400, `got ${res.status}; status now ${(await Booking.findById(b._id)).status}`);
  });

  t('S9 confirm with no seats left -> 400, booking stays pending', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 1, availableSeats: 0 });
    const b = await makeBooking(user.user._id, ev);
    assert.equal((await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: { paymentStatus: 'paid' } })).status, 400);
    const after = await Booking.findById(b._id);
    assert.equal(after.status, 'pending');
    assert.equal(after.paymentStatus, 'unpaid');
    assert.equal((await Event.findById(ev._id)).availableSeats, 0);
  });

  t('S10 confirm still succeeds when the confirmation email fails', async () => {
    const ev = await makeEvent(admin.user._id);
    const b = await makeBooking(user.user._id, ev);
    mailer.fail = true;
    try { assert.equal((await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: {} })).status, 200); }
    finally { mailer.fail = false; }
  });

  t('S11 cancelling a CONFIRMED booking restores the seat', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 3 });
    const b = await makeBooking(user.user._id, ev);
    await api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: {} });
    assert.equal((await Event.findById(ev._id)).availableSeats, 2);
    assert.equal((await api('DELETE', `/api/bookings/${b._id}`, { token: user.token })).status, 200);
    assert.equal((await Event.findById(ev._id)).availableSeats, 3);
  });

  t('S12 cancelling a PENDING booking leaves seats unchanged; second cancel -> 400', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 3 });
    const b = await makeBooking(user.user._id, ev);
    assert.equal((await api('DELETE', `/api/bookings/${b._id}`, { token: user.token })).status, 200);
    assert.equal((await Event.findById(ev._id)).availableSeats, 3);
    assert.equal((await api('DELETE', `/api/bookings/${b._id}`, { token: user.token })).status, 400);
  });

  t('S13 IDOR: user cannot cancel another user\'s booking; admin can', async () => {
    const ev = await makeEvent(admin.user._id);
    const b = await makeBooking(other.user._id, ev);
    assert.equal((await api('DELETE', `/api/bookings/${b._id}`, { token: user.token })).status, 403);
    assert.equal((await api('DELETE', `/api/bookings/${b._id}`, { token: admin.token })).status, 200);
  });

  t('S14 [CONCURRENCY] parallel confirms never overbook (confirmed <= totalSeats, seats consistent)', async () => {
    const ev = await makeEvent(admin.user._id, { totalSeats: 2 });
    const users = await Promise.all(Array.from({ length: 6 }, () => makeUser()));
    const bookings = await Promise.all(users.map((u) => makeBooking(u.user._id, ev)));
    const results = await Promise.all(bookings.map((b) => api('PUT', `/api/bookings/${b._id}`, { token: admin.token, body: {} })));
    const confirmed = await Booking.countDocuments({ eventId: ev._id, status: 'confirmed' });
    const seats = (await Event.findById(ev._id)).availableSeats;
    assert.ok(confirmed <= 2 && seats >= 0 && confirmed + seats === 2,
      `200s=${results.filter((r) => r.status === 200).length}, confirmed=${confirmed}, availableSeats=${seats}, totalSeats=2`);
  });

  t('S15 [CONCURRENCY] same OTP used in parallel creates at most one booking', async () => {
    const evs = await Promise.all([1, 2, 3, 4].map(() => makeEvent(admin.user._id)));
    await api('POST', '/api/bookings/send-otp', { token: other.token });
    const otp = mailer.lastOtpFor(other.email);
    const results = await Promise.all(evs.map((ev) => api('POST', '/api/bookings', { token: other.token, body: { eventId: ev._id, otp } })));
    const created = results.filter((r) => r.status === 201).length;
    assert.ok(created <= 1, `${created} bookings created from one single-use OTP`);
  });
});
