# Nutrisipe Demo Accounts

You can use the following accounts to test the application. All accounts use the same password.

**Password for all accounts:** `password123`

## Administrator Account
- **Email:** `admin@nutrisipe.com`
- **Role:** Full access to all features, including admin dashboard.

## Demo User Accounts
These accounts are generated during the seeding process. You can use any of these:

| Name | Email | Role |
| :--- | :--- | :--- |
| Liam Smith | `liamsmith1@nutrisipe.com` | User |
| Olivia Johnson | `oliviajohnson2@nutrisipe.com` | User |
| Noah Williams | `noahwilliams3@nutrisipe.com` | User |
| Ava Brown | `avabrown4@nutrisipe.com` | User |
| Ethan Jones | `ethanjones5@nutrisipe.com` | User |

*Note: If these specific names don't work, it's because the names are randomized during seeding. You can check the backend logs during login attempts to see valid emails or look into the `dev.db` database.*

---

## About the Database

The project has been migrated to **SQLite** for easier local development.

- **File Location:** `backend/prisma/dev.db`
- **ORM:** Prisma
- **Provider:** `sqlite`

### Why SQLite?
1. **Zero Configuration:** No need to set up a PostgreSQL server or manage cloud credentials (Supabase).
2. **Portability:** The entire database is contained in a single file within the project.
3. **Speed:** Extremely fast for local development and testing.

### How to manage the DB:
To view and edit the database data visually, you can run:
```bash
npx prisma studio
```
This will open a web-based interface at `http://localhost:5555` where you can see all users, recipes, and posts.
