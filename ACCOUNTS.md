# Nutrisipe — Demo Accounts

All seeded accounts share one password.

**Password:** `password123`

## Admin

| Role | Email | Display Name |
| :--- | :--- | :--- |
| ADMIN | `admin@nutrisipe.com` | Nutrisipe Admin |

Admin sees the `/admin` routes (Dashboard, Users, Reports, Analytics) and the Ingredient Editor at `/ingredients`.

## Demo Users (currently seeded)

These exist in the current `backend/prisma/dev.db`. Names randomize on reseed — re-run `./start.sh --reseed` then check `ACCOUNTS.md` (regenerated) or run the SQL snippet below.

| # | Email | Display Name |
| :--- | :--- | :--- |
| 1 | `michaeltorres1@nutrisipe.com` | Michael Torres |
| 2 | `alexandergonzalez2@nutrisipe.com` | Alexander Gonzalez |
| 3 | `ethangarcia3@nutrisipe.com` | Ethan Garcia |
| 4 | `victoriawalker4@nutrisipe.com` | Victoria Walker |
| 5 | `zoeybaker5@nutrisipe.com` | Zoey Baker |
| 6 | `gracelee6@nutrisipe.com` | Grace Lee |
| 7 | `johntorres7@nutrisipe.com` | John Torres |
| 8 | `chloeadams8@nutrisipe.com` | Chloe Adams |
| 9 | `evelynsanchez9@nutrisipe.com` | Evelyn Sanchez |
| 10 | `liamflores10@nutrisipe.com` | Liam Flores |
| 11 | `davidroberts11@nutrisipe.com` | David Roberts |
| 12 | `jacksonwilson12@nutrisipe.com` | Jackson Wilson |

50 users total seed — admin + 49 USER. Email pattern: `<firstname><lastname><n>@nutrisipe.com` (lowercase, n = 1..49).

## List all current users

```bash
sqlite3 backend/prisma/dev.db \
  "SELECT email, display_name, role FROM users ORDER BY role DESC, created_at;"
```

Or open Prisma Studio:

```bash
cd backend && npx prisma studio
# → http://localhost:5555
```

## Personalized data per user

Each user is seeded with:
- **Cuisines** (1–3 of: Italian, Mexican, Asian, Mediterranean, American)
- **Dietary** (0–2 of: Vegan, Keto, Gluten-Free, Low-Carb)
- **Allergies** (0–1 of: Nuts, Dairy, Soy, Shellfish)
- 5–15 random likes
- 3–8 random follows

## Seeded Engagement Data

In addition to standard user profiles, running the full seeding pipeline (`npm run seed:all`) populates:
- **Comments & Replies**: 3–8 comments per post (with 30% nested replies and user mentions).
- **Ratings & Reviews**: 5–20 ratings (1–5 stars) per recipe, with 60% written reviews. Post aggregates (`averageRating`, `ratingCount`) are recalculated.
- **Recipe Variations**: ~15 forks including 2–3 multi-generational chain lineages (Original -> Fork -> Fork-of-Fork).
- **Collections**: 1–3 custom folders per ~20 users with 4–10 posts in each.
- **Conversations & DMs**: ~15 chat logs between mutual follows containing 5–25 messages each (including unread indicators).
- **Stories**: 8–12 active (24h) and expired stories.
- **Meal Plans**: Full 7-day breakfast/lunch/dinner slots for 5 users.
- **Notifications & Mentions**: Pre-populated inbox logs for demo users and the admin account.

## Database

- **Engine:** SQLite (`backend/prisma/dev.db`)
- **ORM:** Prisma 5
- **Seed entry:** `backend/prisma/seed.ts`, `backend/prisma/seed-ingredients.ts`, and `backend/prisma/seed-engagement.ts`.

Reset everything: `./start.sh --reset`
