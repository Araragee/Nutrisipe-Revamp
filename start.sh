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

# Backend env
if [[ ! -f "$BACKEND/.env" ]]; then
  c "no backend/.env — copying from .env.example"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  # Force SQLite for local dev (overrides postgres example)
  if ! grep -q '^DATABASE_URL="file:' "$BACKEND/.env"; then
    sed -i.bak 's|^DATABASE_URL=.*|DATABASE_URL="file:./dev.db"|' "$BACKEND/.env" || true
    rm -f "$BACKEND/.env.bak"
  fi
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

# Reset DB if requested
if [[ $RESET -eq 1 ]]; then
  c "wiping dev.db"
  rm -f "$BACKEND/prisma/dev.db" "$BACKEND/prisma/dev.db-journal"
fi

# Migrate + seed if missing
cd "$BACKEND"
if [[ ! -f "prisma/dev.db" ]]; then
  c "running prisma migrate"
  npx prisma migrate deploy
  c "seeding database"
  npm run seed:all
elif [[ $RESEED -eq 1 ]]; then
  c "reseeding database"
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
