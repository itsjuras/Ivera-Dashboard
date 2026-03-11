# Ivera Dashboard

Business dashboard for Ivera — an AI assistant that answers calls, converts leads, and handles booking and payments automatically.

## Overview

This dashboard gives business owners visibility into their AI assistant's performance:

- **Statistics** — Usage metrics, converted leads, active client count, and more
- **Calendar** — View scheduled clients, synced from their existing calendar system (Google Calendar, Apple Calendar, etc.)

## Tech Stack

- **Frontend:** React, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL

## Project Structure

```
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── views/          # Page-level components (the "V" in MVC)
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API client / data fetching
│       ├── utils/          # Shared utilities
│       └── assets/         # Static assets (images, fonts, etc.)
│
└── server/                 # Node.js backend
    ├── controllers/        # Request handlers (the "C" in MVC)
    ├── models/             # Database models & schemas (the "M" in MVC)
    ├── routes/             # Express route definitions
    ├── middleware/          # Auth, validation, error handling
    └── config/             # Database, environment, and app configuration
```

## Prerequisites

- Node.js (v18+)
- PostgreSQL

## Getting Started

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Set up environment variables
cp server/.env.example server/.env

# Run development servers
cd server && npm run dev    # API server
cd client && npm start      # React dev server
```
