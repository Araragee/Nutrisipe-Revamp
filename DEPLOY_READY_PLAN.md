# Nutrisipe-Revamp: Deploy-Ready Plan (Phases 1–7)

## Context

Recipe social app, monorepo: `frontend/` (Vue 3 + Vite + TS + Tailwind + Pinia) and `backend/` (Express + TS + Prisma + Socket.IO). Prior audit (`ISSUES_AND_PHASES.md`) completed its own phases 0–4 (security hardening, dead-code pass, correctness). This plan is numbered independently (Phases 1–7) and makes the app **deploy-ready**: fix broken API contracts, finish security/dead-code cleanup, refactor duplicated code for mid-level-dev readability, unify the design system, seed rich mock data, switch to Postgres, and ship Docker deploy.

**User decisions:** Docker (any host) · Postgres · local-disk uploads · full design cleanup.

**Default demo login:** `admin@nutrisipe.com` / `password123` (see `ACCOUNTS.md`).

### Key validated facts
- `frontend/src/http/endpoints/posts.ts:26` calls `PATCH /posts/:id`; backend only has `PUT` → update fails.
- `POST /auth/logout-all` called by frontend (`stores/auth.ts:130`, `SettingsView.vue:170`) but missing on backend.
- Uploads currently go to **Cloudinary** (`backend/src/controllers/uploadController.ts`) — local-disk decision means rewriting the controller, not config polish. Backend already serves `app.use('/uploads', express.static(...))`.
- Laravel leftovers still git-tracked: `backend/app/`, `backend/vendor/`, `backend/bootstrap/`, `backend/database/database.sqlite`, `backend/storage/`, `backend/.prisma_home/`, `backend/vite.config.js`.
- **Postgres gotcha:** Prisma `contains` is case-insensitive on SQLite, case-SENSITIVE on Postgres. Affects 6 files (mentions, search, admin routes; ingredient/post/user services). Must add `mode: 'insensitive'` during switch.
- Design tokens exist and are dark-aware: CSS vars in `frontend/src/assets/styles.css` flip under `.dark`; Tailwind config maps them (`bg-surface`, `text-text`, `border-glass-border`, etc.). Scoped-CSS components bypass them.
- `verification/verify_revamp.py` (Playwright smoke test) asserts `.app-shell` and `.recipe-card` class names — design refactor must keep them.
- CI: `.github/workflows/ci.yml` does typecheck+build only. Frontend has vitest (2 util tests); backend has jest (3 service tests) but **no `test` script** in package.json.
- `frontend/docker-compose.yml` exists, oddly placed, postgres-only — superseded in Phase 7.
- Dead CSS: `frontend/src/styles.css`, `frontend/src/output.css` (unreferenced; `main.ts` imports `assets/styles.css`).

---

## Phase 1 — Fix broken API contracts

**Goal:** every frontend endpoint call has a matching backend route.

1. `frontend/src/http/endpoints/posts.ts:26` — `httpClient.patch` → `httpClient.put` (backend PUT is the contract; one-line fix).
2. Backend: add `POST /auth/logout-all` in `backend/src/routes/auth.ts` as authenticated alias of logout. Comment: JWT stateless; real multi-device revocation needs token versioning — out of scope, documented.
3. Sweep all 17 `frontend/src/http/endpoints/*.ts` files against `backend/src/routes/*.ts` (path+verb grep); fix any other mismatch on the cheaper side.

**Verify:** `npm run type-check && npm run build-only` (frontend); `npx tsc --noEmit` (backend); manual: edit post, Settings → log out all devices.

---

## Phase 2 — Local-disk uploads, security polish, dead-code purge

**Goal:** uploads work on local disk; repo has only live code.

1. **Local-disk upload pipeline:**
   - New `backend/src/services/storageService.ts`: `saveImage/saveVideo(tempPath)` → move from `uploads/temp` to `uploads/images|videos/` (uuid filename), return relative `/uploads/...` URL; `deleteFile` helper.
   - Rewrite `backend/src/controllers/uploadController.ts` to use it. Video thumbnail: use client-provided one (route already accepts it; `VideoUpload.vue` captures client-side); else `thumbnailUrl: null`. No server-side ffmpeg.
   - Delete `backend/src/config/cloudinary.ts`; remove `cloudinary` dep.
   - `backend/src/config/env.ts`: add `UPLOAD_DIR` (default `uploads`), `PUBLIC_URL` (optional, for OG absolute URLs); drop `CLOUDINARY_*`.
   - `backend/src/index.ts`: startup validation — create `UPLOAD_DIR/{temp,images,videos}`, write+delete probe file, fail fast if unwritable.
   - Check `frontend/src/utils/imageUrl.ts` (+ test) resolves relative `/uploads/...` URLs; check `backend/src/routes/og.ts` uses `PUBLIC_URL` for absolute image URLs.
2. `app.set('trust proxy', 1)` in `backend/src/index.ts` (needed for rate limiting behind nginx in Phase 7).
3. **Delete dead code** (git rm; confirm with user at execution time): `backend/app/`, `backend/vendor/`, `backend/bootstrap/`, `backend/database/`, `backend/storage/`, `backend/.prisma_home/`, `backend/vite.config.js`, `frontend/src/styles.css`, `frontend/src/output.css`, stray `.DS_Store` artifacts, `frontend/docker-compose.yml`. Drop `@types/socket.io` and unused `socket.io-client` from backend deps if grep confirms unused.
4. Document JWT-in-localStorage risk in root `README.md` (XSS exposure; DOMPurify in place; CSP recommended at nginx). No cookie migration this scope.
5. `backend/package.json`: add `"test": "jest"`. Update CI to run backend jest + frontend vitest.

**Verify:** `npx tsc --noEmit && npx jest` (backend); upload image+video via UI → files in `backend/uploads/`, render in feed; `grep -rn cloudinary backend/src` empty.

---

## Phase 3 — Refactor: dedupe + readability

**Goal:** no duplicated logic between components.

1. New `frontend/src/composables/usePostActions.ts` — extract like/save/comment/share logic duplicated in `components/feed/RecipeModal.vue` and `components/post/PostDetailModal.vue` (~200 lines). Both consume it.
2. New `frontend/src/composables/useFileDrop.ts` — drag-drop + validation shared by `ui/ImageUpload.vue` and `common/VideoUpload.vue`.
3. New `frontend/src/components/common/AvatarStack.vue` (props: `users`, `max`, `size`) — replaces patterns in `variations/VariationChain.vue:99-109` and `layout/AppShell.vue`.
4. `PostDetailModal.vue`: inline spinner → existing `LoadingSpinner`; `alert()` (line ~108) → `useToast`.
5. `ratings/RatingInput.vue`: inline-styled buttons → existing `base/BaseButton.vue`.
6. Keep `.app-shell` / `.recipe-card` class names (smoke test depends on them).

**Verify:** `npm run type-check && npm test && npm run build-only`; manual: like/save/comment/share in both modals; drag-drop image + video.

---

## Phase 4 — Design system cleanup (full)

**Goal:** Tailwind tokens everywhere; dark mode complete; no scoped-CSS color literals.

Token primer: token classes (`bg-surface`, `text-text`, `text-text-muted`, `bg-glass`, `border-glass-border`, `text-orange`) auto-flip dark via CSS vars. `dark:` variants only needed for raw palette classes.

1. `frontend/tailwind.config.js` — add named colors: `nutriscore: {a:'#008b4c', b:'#85bb2f', c:'#fecb02', d:'#ee8100', e:'#e63e11'}`, `nutrition: {calories:'#FF6B35', protein:'#4ECDC4', carbs:'#FFE66D', fat:'#FF6B8A'}`.
2. `feed/PinCard.vue` — Nutri-Score computed (83–98) → `bg-nutriscore-*`; `bg-[#111]` → `bg-neutral-900`.
3. `base/BaseCard.vue:21` — drop `dark:bg-[#0f0d15]/86`; `bg-glass border-glass-border` already dark-aware.
4. `feed/RecipeModal.vue:48` — nutrition hexes → computed class lookup (user's computed-style-lookup pattern); remove inline `:style` colors.
5. Convert scoped-CSS components to Tailwind tokens (delete color rules; keep structural CSS/keyframes only): `ratings/RatingInput.vue`, `common/StarRating.vue`, `common/MentionInput.vue`, `post/CommentSection.vue`, `variations/VariationChain.vue` (biggest, 30+ literals), `variations/OriginalRecipeBadge.vue`.
6. Sweep stragglers: `grep -rn "#[0-9a-fA-F]\{3,6\}"` + `grep -rln "<style scoped>"` over `frontend/src/components` — convert remaining (ForkRecipeButton, RatingList, MobileNav, FeedHeader, StoriesRail, NotificationDropdown, ToastContainer, RichTextEditor, ExperimentRecipeModal, StoryComposer, VideoPlayer). Decorative mesh/mosaic backgrounds may keep gradient CSS but route colors through vars.

**Verify:** build + type-check; toggle dark mode and walk feed/modals/ratings/mentions/variations/comments — no contrast failures; hex-grep returns only justified hits; optional `python verification/verify_revamp.py`.

---

## Phase 5 — Rich mock data

**Goal:** every feature surface has demo content.

Strategy: **new `backend/prisma/seed-engagement.ts`** (matches `seed-ingredients.ts` pattern; leaves proven `seed.ts` mostly untouched). Idempotent — clears only its own tables.

1. `seed.ts` minor edit: recipe `ingredients` JSON uses names from the 54 PH FCT ingredients (no schema change; JSON column stays).
2. `seed-engagement.ts` creates (FK-safe order):
   - Comments: 3–8 per popular post, 30% with nested replies (`parentId`).
   - Ratings: 5–20 per recipe post, ~60% with review text (respect `@@unique([userId, postId])`).
   - RecipeVariations: ~15 recipe posts × 1–3 forks, incl. 2–3 chains (variation-of-variation).
   - Collections: 1–3 per ~20 users, 4–10 posts each, mixed public/private.
   - Conversations + Messages: ~15 convos between mutual follows, 5–25 messages, some unread.
   - Stories: 8–12 active (expire +20h, some linked to posts) + few expired.
   - MealPlans: current week filled for 5 users.
   - UserPreferences for ~30 users; Notifications + Mentions derived from generated activity so demo accounts' bell is populated.
3. Scripts: `"prisma:seed-engagement"`, `"seed:all"` (seed → ingredients → engagement) in `backend/package.json`; `start.sh` uses `seed:all`.
4. Update `ACCOUNTS.md`.

**Verify:** reseed clean; walk app as admin: comments+replies, ratings, variation chains, messages w/ unread badges, stories rail, meal planner, collections, notifications. `npx prisma studio` row-count spot check.

---

## Phase 6 — SQLite → Postgres

**Goal:** Postgres everywhere; SQLite gone.

Migration strategy: **fresh baseline** (pre-production app; sqlite migrations can't be reused on postgres anyway).

1. Root `docker-compose.dev.yml`: `postgres:16-alpine` + volume + healthcheck (dev DB).
2. `backend/prisma/schema.prisma` → `provider = "postgresql"`. Keep JSON-as-String columns (no schema redesign).
3. Delete `backend/prisma/migrations/*`; `npx prisma migrate dev --name init` against local postgres → new baseline + postgres lock file.
4. **Add `mode: 'insensitive'`** to every string `contains` filter: `routes/mentions.ts`, `routes/search.ts`, `routes/admin.ts`, `services/ingredientService.ts`, `services/postService.ts`, `services/userService.ts`.
5. `backend/.env.example`: postgres-only DATABASE_URL.
6. `start.sh`: bring up dev postgres (`pg_isready` wait), `prisma migrate deploy`, seed-if-empty guard.
7. Delete `backend/prisma/dev.db`; gitignore `*.db`.
8. CI: dummy postgres URL for `prisma generate` (generate doesn't connect — simplest).

**Verify:** clean migrate on empty postgres; `seed:all` completes; jest + tsc pass; search "ADOBO" vs "adobo" same results; full app walk on Postgres.

---

## Phase 7 — Docker deploy

**Goal:** `docker compose up -d` = running app on any host.

Layout: root `docker-compose.yml` (postgres + backend + frontend + opt-in `seed` profile), `docker-compose.dev.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, rewritten root `.env.example`, new `frontend/.env.example`.

1. `backend/Dockerfile` multi-stage: build (npm ci, prisma generate, tsc) → runtime (`node:20-alpine`, prod deps + generated client, `prisma/` for migrate deploy, non-root user). Entrypoint: `prisma migrate deploy` then `node dist/index.js`.
2. `frontend/Dockerfile` multi-stage: build with `ARG VITE_API_URL=/api`, `ARG VITE_GOOGLE_CLIENT_ID` → `nginx:alpine` + config.
3. `frontend/nginx.conf`: SPA fallback; proxy `/api/`, `/uploads/`, `/socket.io/` (websocket upgrade headers) → `backend:3001`; `client_max_body_size 120m`. Same-origin relative `VITE_API_URL=/api` eliminates CORS. Check socket client URL derivation in frontend services.
4. Compose: postgres (volume, healthcheck) · backend (depends_on healthy, `uploads_data:/app/uploads` volume, env: DATABASE_URL/JWT_SECRET/CORS_ORIGIN/NODE_ENV=production/UPLOAD_DIR) · frontend (`80:80`) · seed one-shot (`profiles: ["seed"]`, run via `docker compose --profile seed run --rm seed`). Opt-in seed beats auto-seed (no accidental prod reseed).
5. Env examples: root (`POSTGRES_*`, `JWT_SECRET`, `VITE_GOOGLE_CLIENT_ID`, `PUBLIC_URL`); `frontend/.env.example` (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`); type `ImportMetaEnv` in `frontend/env.d.ts`.
6. `.dockerignore` both sides (node_modules, uploads, *.db, dist).
7. Root `README.md`: quickstart (dev `start.sh`, prod compose), env table, seed command, uploads-volume backup note, JWT security note.

**Verify:** `docker compose build` clean; `up -d` → app at `http://localhost`; seed profile populates; login via seeded account (dev-login auto-off in production); image upload persists across `restart backend`; realtime message between two sessions (socket proxy); dark mode; `down && up -d` → data + uploads survive.

---

## Dependency order

```
1 (routes) → 2 (uploads/security/cleanup) → 3 (refactor) → 4 (design) → 5 (seeds) → 6 (postgres) → 7 (docker)
```

Each phase independently shippable; CI gates each (typecheck + build + tests from Phase 2 on).

## Critical files
- `backend/src/index.ts` — static uploads, trust proxy, startup validation
- `backend/src/controllers/uploadController.ts` — Cloudinary → local disk rewrite
- `backend/prisma/schema.prisma` — provider switch + fresh baseline
- `frontend/src/components/feed/RecipeModal.vue` — usePostActions + token cleanup epicenter
- `frontend/tailwind.config.js` — nutriscore/nutrition tokens feeding design phase
