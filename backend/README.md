# Nutrisipe Backend

This is the Node.js/Express API for the Nutrisipe platform. It uses Prisma ORM with PostgreSQL.

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your database credentials and secrets.
   ```bash
   cp .env.example .env
   ```

3. **Database Setup:**
   Generate Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Seed Database (Optional):**
   ```bash
   npm run prisma:seed
   ```

## Running the Server

- **Development mode (with auto-reload):**
  ```bash
   npm run dev
  ```

- **Production mode:**
  ```bash
  npm run build
  npm start
  ```

## API Documentation

The server typically runs on `http://localhost:3000`. You can explore the database via Prisma Studio:
```bash
npm run prisma:studio
```
