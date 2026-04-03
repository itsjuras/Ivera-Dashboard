# Ivera Dashboard

Business dashboard for Ivera — an AI assistant that answers calls, converts leads, and handles booking and payments automatically.

## Overview

This dashboard gives business owners visibility into their AI assistant's performance:

- **Statistics** — Usage metrics, converted leads, active client count, and more
- **Calendar** — View scheduled clients, synced from their existing calendar system (Google Calendar, Apple Calendar, etc.)

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase (PostgreSQL)

## Project Structure

```
├── migration.sql           # Run once in Supabase to set up roles/products/plans tables
├── client/                 # React frontend
│   └── src/
│       ├── views/          # Page-level components
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks (useAuth)
│       ├── services/       # API client (api.ts, supabase.ts)
│       └── assets/         # Static assets
│
└── server/                 # Express backend
    └── src/
        ├── controllers/    # Request handlers
        ├── models/         # Database queries (authModel, userModel)
        ├── routes/         # Route definitions (auth, user, dashboard, etc.)
        ├── middleware/     # requireAuth, requireIveraAdmin
        └── config/         # DB connection (Supabase service role)
```

---

## Prerequisites

- Node.js v18+
- A Supabase project (free tier works)

---

## First-Time Setup

### 1. Supabase — Run the migration

Open the Supabase SQL editor and run `migration.sql` from the root of this repo.

This creates:
- `products` — catalog of all Ivera products (seeded with receptionist, sales, consultant, support)
- `plans` — free / starter / pro / max / custom, each with a default monthly price
- `user_roles` — maps each user to `ivera_admin` or `customer`
- `user_products` — subscription records (user + product + plan + optional custom pricing)

### 2. Environment variables

**Server** (`server/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
```

**Client** — create `client/.env` (or `client/.env.local`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:4000
```

> The server uses the **service role key** (full DB access, never expose to the browser).
> The client uses the **anon/public key**.

### 3. Install dependencies and start

```bash
cd server && npm install && npm run dev   # API server — http://localhost:4000
cd client && npm install && npm start     # React dev server — http://localhost:3000
```

---

## Authentication & Roles

### Ivera admin (first sign-up)

1. Go to `/signup`
2. Enter your `@ivera.ca` email and a password
3. The server detects the domain and automatically:
   - Assigns the `ivera_admin` role
   - Grants all products on the **max** plan

From then on, sign in at `/login`. The nav will show all products plus an **Admin** link.

### Customer sign-up

1. Customer goes to `/signup`
2. They enter the phone number on file (verified against the `clients` table)
3. They set their email and password
4. Account is created with the `customer` role and **no products**
5. An Ivera admin must assign products and plans via the admin API (or admin UI)

---

## Products & Plans

### Products

Products are rows in the `products` table. The current set:

| Slug | Name |
|------|------|
| `receptionist` | Receptionist |
| `sales` | Sales Agent |
| `consultant` | Consultant |
| `support` | Support |

### Plans

| Slug | Name | Default price (CAD/mo) |
|------|------|------------------------|
| `free` | Free | $0 |
| `starter` | Starter | $49 |
| `pro` | Pro | $149 |
| `max` | Max | $299 |
| `custom` | Custom | — (set per customer) |

Custom pricing and notes can be set per customer per product via the admin API.

---

## Adding a New Product

1. **Database** — insert a row:
   ```sql
   insert into products (slug, name, description) values
     ('my_new_product', 'My New Product', 'What it does');
   ```

2. **Server** — add the slug to `ALL_PRODUCT_SLUGS` in `server/src/models/userModel.ts`
   so new Ivera admin accounts are auto-provisioned with it.

3. **Client** — add one entry to `PRODUCT_REGISTRY` in `client/src/App.tsx`
   and create its route + view component.

---

## API Reference

All authenticated endpoints require `Authorization: Bearer <supabase_access_token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/verify-phone` | — | Check phone against clients table (customer signup step 1) |
| `POST` | `/api/auth/post-signup` | User | Provision role + products after Supabase account creation |

### User

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/user/me` | User | Current user's role and active product subscriptions |
| `GET` | `/api/user/plans` | User | All available plans |

### Admin (Ivera admin only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/user/customers` | ivera_admin | List all customers and their products |
| `POST` | `/api/user/customers/:userId/products` | ivera_admin | Assign a product to a customer |
| `PATCH` | `/api/user/customers/:userId/products/:productSlug` | ivera_admin | Update plan / custom price / notes |
| `DELETE` | `/api/user/customers/:userId/products/:productSlug` | ivera_admin | Deactivate a product for a customer |

#### POST / PATCH body for customer products

```json
{
  "productSlug": "receptionist",
  "planId": 4,
  "customPriceCad": 199.00,
  "customNotes": "Q1 deal — 20% off for 3 months"
}
```

`customPriceCad` and `customNotes` are optional. If `customPriceCad` is set it overrides the plan's default price.

---

## Development Commands

### Server (`server/`)

```bash
npm run dev     # Start with hot reload (ts-node-dev)
npm run build   # Compile TypeScript to dist/
npm start       # Run compiled output
```

### Client (`client/`)

```bash
npm start       # Vite dev server
npm run build   # Production build
npm run lint    # ESLint
```
