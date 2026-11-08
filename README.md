<div align="center">

<img src="client/public/favicon.svg" alt="Evora logo" width="80" height="80" />

# Evora

#### A full-stack MERN event booking platform. Discover events, book your seat with an emailed code, and keep every booking in one place.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

[✨ Features](#-features) • [🛠 Tech Stack](#-tech-stack) • [🚀 Getting Started](#-getting-started) • [🗺 API Routes](#-api-routes-overview) • [📁 Structure](#-project-structure)

</div>

## ✨ Features

### 🎟️ For visitors and users

- 🏠 **Browse Events** — See upcoming and recently finished events on the home page, no account needed
- ✉️ **Email Verification** — Sign up and verify your account with a one-time code
- 🔍 **Event Details and Filters** — Log in to view full details and filter events by category
- 🎫 **Code-Confirmed Booking** — Book a seat with an emailed code, then track it as pending, confirmed or cancelled
- ❌ **Easy Cancellation** — Cancel any upcoming booking
- 🌗 **Light and Dark Themes** — Follows your system setting or your own choice, with an animated sun and moon toggle
- 📱 **Responsive Design** — Animated, accessible components that work across all screen sizes

### 🧑‍💼 For admins

- 📋 **Booking Dashboard** — See every booking, with status filters, search and pagination
- ✅ **Confirmations and Payments** — Confirm bookings and record payment status
- 🗓️ **Event Management** — Create, edit and delete events

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| ⚛️ **Frontend** | React 19, React Router 7, Vite 8 |
| 🎨 **Styling** | Tailwind CSS 4 |
| 🎞️ **Animation** | Motion |
| 🔌 **API Client** | Axios |
| 🟢 **Backend** | Node.js, Express 5 |
| 🍃 **Database** | MongoDB, Mongoose 9 |
| 🔐 **Auth** | JSON Web Tokens, bcryptjs |
| 📧 **Email** | Nodemailer with Brevo SMTP |
| 🚦 **Rate Limiting** | express-rate-limit |

## 🚀 Getting Started

### Prerequisites

- 🟢 [Node.js](https://nodejs.org) 20.19+ or 22.12+
- 🍃 A MongoDB database (local or [MongoDB Atlas](https://cloud.mongodb.com))
- 📧 A free [Brevo](https://www.brevo.com) account for sending emails, with your sender address verified

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/joydeep-devx/evora.git
cd evora
```

**2. Set up the backend**

```bash
cd server
npm install
```

Create `server/.env` (see [Environment Variables](#-environment-variables) below), then start the API:

```bash
npm run dev
```

**3. Set up the frontend**

In a second terminal, from the project root:

```bash
cd client
npm install
```

Create `client/.env` (see [Environment Variables](#-environment-variables) below), then start the app:

```bash
npm run dev
```

The app will be running at **http://localhost:5173**

**4. Create an admin account**

New accounts are always regular users. To make an admin, sign up normally, then set that user's `role` to `admin` in your database.

## 🔑 Environment Variables

**`server/.env`**

```env
# Port the API listens on
PORT=5000

# MongoDB connection string
MONGO_URI=your_mongodb_connection_string

# Used to sign login tokens (use a long random string)
JWT_SECRET=a_long_random_string

# Sender address (must be a verified sender in Brevo)
EMAIL_USER=your_sender_email

# Brevo SMTP (find these under SMTP & API in Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_USER=your_brevo_smtp_login
SMTP_PASS=your_brevo_smtp_key
```

**`client/.env`**

```env
# Base URL of the API
VITE_API_URL=http://localhost:5000/api
```

In production, also set `NODE_ENV=production` and `TRUST_PROXY` to the number of proxies in front of the app (usually `1`), so rate limits apply per visitor.

> ⚠️ **Never commit your `.env` files.** Use `server/.env.example` as a guide.

## 🔒 Security Notes

- 🔑 Passwords hashed with **bcrypt**
- 🪪 **JWT** authentication with role-based access for users and admins
- 🚦 Rate limiting on login, sign-up, code checks and code emails, plus a limit on wrong guesses per code
- 🧹 Login and code inputs must be plain strings, which blocks NoSQL injection through those fields
- ⚛️ Atomic seat updates, so simultaneous confirmations can't overbook an event

## 🗺 API Routes Overview

All routes are under `/api`. Protected routes expect an `Authorization: Bearer <token>` header.

### 👤 Auth

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account and email a verification code |
| POST | `/auth/login` | Public | Log in |
| POST | `/auth/verify-otp` | Public | Verify an account with its code |

### 🎉 Events

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/events` | Public | List events (without full descriptions) |
| GET | `/events/:id` | User | Get full event details |
| POST | `/events` | Admin | Create an event |
| PUT | `/events/:id` | Admin | Update an event |
| DELETE | `/events/:id` | Admin | Delete an event |

### 🎫 Bookings

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/bookings/my` | User | Your bookings (admins get all bookings) |
| POST | `/bookings/send-otp` | User | Email a booking code |
| POST | `/bookings` | User | Request a booking with a code |
| PUT | `/bookings/:bookingId` | Admin | Confirm a booking and set payment status |
| DELETE | `/bookings/:bookingId` | Owner or admin | Cancel a booking |

## 📁 Project Structure

```
evora/
├── client/                   # React frontend
│   ├── public/               # Static files
│   └── src/
│       ├── components/       # Shared, home, event, admin and UI components
│       ├── context/          # Authentication state
│       ├── hooks/            # Data-loading hooks
│       ├── pages/            # Route pages, including admin pages
│       └── utils/            # API client and helpers
└── server/                   # Express API
    ├── index.js              # Entry point
    └── src/
        ├── controllers/      # Request handlers
        ├── db/               # Database connection
        ├── middlewares/      # Auth and rate limiting
        ├── models/           # Mongoose schemas
        ├── routes/           # API routes
        └── services/         # Email and code checking
```

## 📜 Scripts

| Folder | Command | Description |
|---|---|---|
| `server` | `npm run dev` | Start the API with auto-reload |
| `server` | `npm start` | Start the API |
| `client` | `npm run dev` | Start the development server |
| `client` | `npm run build` | Build for production |
| `client` | `npm run preview` | Preview the production build |
| `client` | `npm run lint` | Run the linter |

## 🧭 Roadmap

- [ ] ✅ Stricter server-side input validation with consistent error responses
- [ ] 🔁 A resend-code option on the verification page
- [ ] 💳 Online payments (payment status is currently recorded by an admin)
- [ ] 📄 Server-side pagination for events and bookings

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

Released under the [MIT License](LICENSE) © 2026 Joydeep Saha

<div align="center">
    <p>Made with ❤️ by Joydeep Saha<br>
    ⭐ Star this repo if you found it helpful!</p>
</div>
