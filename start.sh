#!/usr/bin/env bash
# Nutrisipe — start backend + frontend together.
# Usage: ./start.sh           start both
#        ./start.sh --reseed  rerun prisma seed before launching
#        ./start.sh --reset   wipe dev.db and re-migrate + seed
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
RESEED=0
RESET=0

for arg in "$@"; do
  case "$arg" in
    --reseed) RESEED=1 ;;
    --reset)  RESET=1 ;;
    -h|--help)
      grep '^# ' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown flag: $arg"; exit 2 ;;
  esac
done

c() { printf "\033[1;36m[start.sh]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[start.sh]\033[0m %s\n" "$*" >&2; }

# Sanity
[[ -d "$BACKEND" ]]  || { err "missing $BACKEND"; exit 1; }
[[ -d "$FRONTEND" ]] || { err "missing $FRONTEND"; exit 1; }

# Start dev postgres database if not running
c "bringing up dev postgres container"
docker compose -f "$ROOT/docker-compose.dev.yml" up -d

# Wait for postgres to be ready
c "waiting for postgres to be ready..."
until docker exec nutrisipe-postgres-dev pg_isready -U nutrisipe -d nutrisipe_dev >/dev/null 2>&1; do
  sleep 1
done

# Backend env
if [[ ! -f "$BACKEND/.env" ]]; then
  c "no backend/.env — copying from .env.example"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
fi

# Install deps
if [[ ! -d "$BACKEND/node_modules" ]]; then
  c "installing backend deps"
  (cd "$BACKEND" && npm install)
fi
if [[ ! -d "$FRONTEND/node_modules" ]]; then
  c "installing frontend deps"
  (cd "$FRONTEND" && npm install)
fi

cd "$BACKEND"

# Reset DB if requested
if [[ $RESET -eq 1 ]]; then
  c "resetting database schema"
  npx prisma migrate reset --force --skip-seed
fi

# Migrate + seed if missing
c "applying migrations"
npx prisma migrate deploy

c "checking if database needs seeding"
IS_EMPTY=$(npx tsx -e "import { PrismaClient } from '@prisma/client'; new PrismaClient().user.count().then(c => console.log(c === 0 ? 'true' : 'false')).catch(() => console.log('true'))")

if [[ "$IS_EMPTY" == "true" ]] || [[ $RESEED -eq 1 ]]; then
  c "seeding database"
  npm run seed:all
fi

# Generate Prisma client (cheap if already current)
npx prisma generate >/dev/null 2>&1 || true

cd "$ROOT"

# Cleanup on exit
BACK_PID=""
FRONT_PID=""
cleanup() {
  c "shutting down…"
  [[ -n "$BACK_PID"  ]] && kill "$BACK_PID"  2>/dev/null || true
  [[ -n "$FRONT_PID" ]] && kill "$FRONT_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

c "starting backend on :3000"
(cd "$BACKEND" && npm run dev) &
BACK_PID=$!

# Wait briefly for backend to bind
for _ in $(seq 1 30); do
  if curl -fs http://localhost:3000/ >/dev/null 2>&1; then break; fi
  sleep 0.5
done

c "starting frontend on :5173"
(cd "$FRONTEND" && npm run dev) &
FRONT_PID=$!

c "ready → http://localhost:5173  (api: http://localhost:3000)"
c "Ctrl+C to stop"

wait
