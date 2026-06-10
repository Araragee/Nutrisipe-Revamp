# Nutrisipe-Revamp — Issue Audit & Phased Implementation Plan

_Date: 2026-06-09 · Branch: `claude/issue-audit-plan-t1z40w`_

Every issue below with an ID like `B-01` / `F-01` is marked in the code with a matching
`TODO(audit:<ID>)` comment at the exact spot. Search the repo for `TODO(audit:` to jump to them.
Issues without an ID are repo-level (file deletion / config) and have no sensible code location
for a comment.

---

## 1. Issue Inventory

### 1.1 Backend (Express + Prisma, `backend/src`)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| B-01 | CRITICAL | `src/routes/auth.ts:11` | `/dev-login` bypasses password auth, no `NODE_ENV` guard — auth bypass if deployed |
| B-02 | HIGH | `src/middleware/auth.ts:26-31` | Logs JWT fragments and decoded payloads to console |
| B-03 | HIGH | `src/config/database.ts` | Duplicate `PrismaClient` next to the `src/lib/prisma.ts` singleton — connection-pool risk |
| B-04 | HIGH | `src/controllers/authController.ts:44,48` | Logs emails / user IDs (PII) on login |
| B-05 | MEDIUM | `src/index.ts:32` | Only one global rate limit; auth endpoints brute-forceable at 100 req/15min |
| B-06 | MEDIUM | `src/controllers/usersController.ts:98` | `updateProfile` passes raw `req.body` with no Zod schema — arbitrary field injection |
| B-07 | MEDIUM | `src/services/notificationService.ts:20` | Check-then-create race → duplicate notifications |
| B-08 | MEDIUM | `src/controllers/postsController.ts:46` (+ all controllers) | Pagination unclamped (`limit=999999`, `page=-1`) — DoS vector |
| B-09 | LOW | `src/routes/search.ts:21` | `%` / `_` LIKE wildcards not escaped from user query |
| B-10 | LOW | `src/socket/index.ts:13` | Socket CORS uses `process.env.CLIENT_URL`, Express uses `env.CORS_ORIGIN` — can drift |
| B-11 | MEDIUM | `src/controllers/uploadController.ts:114` | Custom thumbnail failure silently swallowed |
| B-12 | MEDIUM | `src/services/postService.ts:getFeed` | 70/30 feed mix with fractional skips — pagination totals wrong |
| B-13 | MEDIUM | `src/middleware/upload.ts:9` | `uploads/temp` never created/verified at startup |
| B-14 | MEDIUM | `src/routes/admin.ts` (ban) | Ban only flips flags; banned user content stays visible |
| B-15 | MEDIUM | `prisma/schema.prisma` (Post) | Missing compound indexes `[userId, createdAt]`, `[conversationId, createdAt]` |
| — | CRITICAL | `backend/.env.example:5` | Placeholder `JWT_SECRET="your-super-secret-jwt-key"` — forgeable tokens if shipped as-is |
| — | HIGH | `backend/app/`, `routes/`, `config/`, `bootstrap/`, `database/`, `resources/`, `public/`, `vendor/`, `composer.json`, `artisan` | Entire dead Laravel skeleton beside the live Express app |
| — | MEDIUM | `src/routes/admin.ts`, `src/routes/messages.ts` (many lines) | Generic `500` responses with only `console.error` — no structured logging / request IDs |
| — | LOW | `src/routes/*`, `src/services/postService.ts` | Pervasive `any` types defeat TS safety |
| — | LOW | `src/services/commentService.ts:1` | Default-import of prisma while everything else uses named import |
| — | LOW | `src/routes/admin.ts:338` | `req.user!.id` non-null assertion instead of guard |

### 1.2 Frontend (Vue 3 + Pinia, `frontend/src`)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| F-01 | CRITICAL | `components/feed/PinCard.vue:80` | Hardcoded `http://localhost:3001` image base URL |
| F-02 | HIGH | `services/socket.ts:23` | Silent localhost fallback hides missing `VITE_API_URL` in prod |
| F-03 | HIGH | `stores/auth.ts:9` | JWT in `localStorage` — readable by any XSS payload |
| F-04 | HIGH | `http/posts.ts`, `http/comments.ts` | Duplicate API clients overlapping `http/endpoints/*` |
| F-05 | MEDIUM | `services/socket.ts` (~20 callbacks) | Event payloads typed `any` |
| F-06 | HIGH | `components/ui/RichTextEditor.vue:29` | Unsanitized `innerHTML` write (XSS) + deprecated `document.execCommand` |
| F-07 | MEDIUM | `composables/useMentions.ts:renderMentions` | Builds HTML from user text without escaping |
| F-08 | MEDIUM | `stores/messages.ts:122,137` | Fire-and-forget `loadConversations()` — unhandled rejections |
| F-09 | MEDIUM | `stores/ui.ts:showToast` | Overlapping toast timers clear each other early |
| F-10 | MEDIUM | `stores/notifications.ts` | In-place mutation after API calls — desync vs socket refresh |
| F-11 | MEDIUM | `composables/usePerformance.ts:211` | `load` listener never removed; no `onUnmounted` cleanup |
| F-12 | LOW | `stores/variations.ts:92` | `deleteVariation` is a stub — item reappears on reload |
| F-13 | MEDIUM | `views/ProfileView.vue:72` | Load failure only logged; no user-facing error; `Promise.all` all-or-nothing |
| F-14 | MEDIUM | `components/post/PostDetailModal.vue:3` | Mixes legacy and new API client in one component |
| F-15 | MEDIUM | `components/layout/AppShell.vue` (~8 spots) | `v-html="ICONS[key]"` pattern — replace with icon components |
| F-16 | HIGH | `views/LoginView.vue:loginWithDemo` | Demo login UI depends on `/dev-login` (B-01); must be dev-only |
| — | LOW | `frontend/nutrisipe_revamp_ui/` | Design handoff bundle living inside the app folder |
| — | LOW | views/stores (~25 spots) | `console.error`/`console.log` noise throughout |
| — | LOW | `views/RecipeDetailView.vue:31`, `views/ProfileView.vue:31` | Unsafe casts / `any[]` refs |

### 1.3 Repo root

| Severity | Path | Issue |
|----------|------|-------|
| LOW | `Nutrisipe.html` (158 KB) | Dead legacy prototype at repo root |
| LOW | `ACCOUNTS.md` + `DEMO_ACCOUNTS.md` | Two overlapping demo-account docs that drift apart |
| LOW | `AUDIT_AND_PLAN.md` | Stale audit (2026-04-26) referencing an absolute path on another machine |
| LOW | `.env.example` (root) | Postgres-only vars while the app actually runs SQLite via `start.sh` |

---

## 2. Phased Plan

Each phase is independently shippable and ordered by risk. One PR per phase.

### ✅ Phase 0 — Stop the bleeding (security) · DONE 2026-06-09
**Goal: nothing exploitable remains on a deployed build.**
1. ✅ `/dev-login` registered only when `NODE_ENV !== 'production'` (B-01). Demo-login UI in `LoginView.vue` turned out to be dead code (never referenced in the template) and was removed (F-16).
2. ✅ Stripped token/PII console logging from auth middleware and auth controller (B-02, B-04).
3. ✅ Dedicated auth rate limiter on `/api/auth/*`: 10 req/15min in production, 100 in dev, `skipSuccessfulRequests` on (B-05).
4. ✅ `RichTextEditor` now sanitizes with DOMPurify (allowlist of toolbar tags) on both model→DOM writes and emitted values; `renderMentions` escapes input before building markup (F-06, F-07). `dompurify` added to frontend deps. execCommand migration deferred to Phase 5 (`TODO(audit:F-06b)`).
5. ✅ `backend/.env.example` ships a clearly-dev secret with generation instructions; `env.ts` refuses to start in production with a placeholder or <32-char `JWT_SECRET` (warns in dev).

**Gate passed:** `tsc --noEmit` clean both apps; prod boot verified — `/dev-login` → 404, placeholder secret → startup error; dev boot verified — `/dev-login` route live.

### ✅ Phase 1 — Burn the dead wood · DONE 2026-06-09
**Goal: one backend, one API client, clean root.**
1. ✅ Deleted entire Laravel skeleton: `app/`, `routes/`, `config/`, `bootstrap/`, `database/`, `resources/`, `public/`, `vendor/`, `composer.json`, `composer.lock`, `artisan`, `phpunit.xml` — grepped zero references first.
2. ✅ Deleted `src/config/database.ts`; migrated `postService.perf.test.ts` to mock `lib/prisma` instead (B-03).
3. ✅ Migrated `PostDetailModal.vue` → `postsApi.getById`, `CreatePostModal.vue` → `postsApi.create`, then deleted `http/posts.ts` and `http/comments.ts` (no importers on comments.ts) (F-04, F-14).
4. ✅ Root cleanup: removed `Nutrisipe.html` (155 KB dead prototype), `DEMO_ACCOUNTS.md` (duplicate of `ACCOUNTS.md`), `AUDIT_AND_PLAN.md` (stale), `frontend/nutrisipe_revamp_ui/` (design handoff bundle).

**Gate passed:** `tsc --noEmit` clean on both apps; `grep -r "http/posts'" frontend/src` → empty.

### Phase 2 — Correctness bugs · ~1 day ✅ Done
**Goal: the marked logic bugs are fixed with tests where cheap.**
1. ✅ Shared `parsePagination()` helper with clamping; use it in every controller (B-08).
2. ✅ Fix feed pagination metadata to reflect the actual mixed result set (B-12).
3. ✅ Wrap notification dedupe in a transaction or unique constraint + upsert (B-07).
4. ✅ Zod schema for profile updates whitelisting `displayName`, `bio`, `avatarUrl` (B-06).
5. ✅ Surface thumbnail-upload failure as a response warning (B-11); ensure `uploads/temp` exists at startup (B-13).
6. ✅ Frontend: toast timer handle (F-09), `.catch()` on fire-and-forget calls (F-08), error states in ProfileView (F-13), `load`-listener cleanup (F-11), implement `deleteVariation` (F-12).
7. ✅ Banned-user posts filtered from feed queries (B-14).

**Gate:** backend `npm test` green; manual smoke of feed paging, notifications, profile edit. ✅

### Phase 3 — Config & schema hygiene · ~½ day ✅ Done
**Goal: env handling and DB are deploy-ready.**
1. ✅ Central asset-URL helper from `VITE_API_URL`; replaced hardcoded localhost in `PinCard.vue`; socket derives URL from same constant (F-01, F-02).
2. ✅ Unified socket CORS on `env.CORS_ORIGIN` (B-10).
3. ✅ Added compound indexes `Post @@index([userId, createdAt])`, `Message @@index([conversationId, createdAt])` via `prisma migrate dev` (B-15).
4. ✅ Escaped LIKE wildcards in search (B-09).
5. ✅ `.env.example` updated with SQLite default and Postgres docs.

**Gate:** fresh clone + `./start.sh` works with only documented env vars; prisma migration applies cleanly. ✅

### Phase 4 — Type safety & logging · ~1 day ✅ Done
**Goal: kill `any`, kill console noise.**
1. Typed socket event payload interfaces shared between `services/socket.ts` and stores (F-05). ✅
2. Replace `any` in backend routes/services with proper types; remove `req.user!` assertions. ✅
3. Introduce a tiny logger wrapper (silent in prod) and sweep all `console.*` from both apps. ✅
4. Structured error logging with request context before 500 responses in admin/messages routes. ✅

**Gate:** `tsc --noEmit` clean in both apps; `grep -rn "console\." src` only hits the logger. ✅

### Phase 5 — Hardening (optional / discuss first) · ~1-2 days
1. Move auth from localStorage JWT to httpOnly cookie sessions (F-03) — touches backend auth, CORS, socket auth; needs a decision.
2. Replace `RichTextEditor` execCommand implementation with a maintained editor (TipTap) (F-06 part 2).
3. Replace `v-html` icon pattern with icon components (F-15).
4. Reconcile optimistic store mutations with socket pushes (F-10).

**Gate:** full regression of login/logout, messaging, post creation.

---

## 3. How to work this plan

- Search `TODO(audit:` to find every marked site; delete the TODO comment in the same commit that fixes it.
- One phase per PR, commits named `audit-fix(<ID>): <summary>`.
- Phases 0–2 are prerequisites for any deployment. 3–4 are quality. 5 needs a product/architecture decision first.
