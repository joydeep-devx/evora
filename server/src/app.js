const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const bookingRoutes = require('./routes/booking.routes');
const app = express();

// Behind a hosting proxy, every request appears to come from the proxy's IP, so all
// users would share one rate limit. TRUST_PROXY = number of proxies in front (usually 1).
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

module.exports = app;