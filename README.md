# Nutrisipe Revamp

Pinterest-style recipe sharing social platform.

## Repository Structure

- [backend](file:///Users/dex/Documents/Nutrisipe-Revamp/backend): API service (Express, TypeScript, Prisma, Socket.IO, PostgreSQL).
- [frontend](file:///Users/dex/Documents/Nutrisipe-Revamp/frontend): Web SPA (Vue 3, Vite, TypeScript, Tailwind, Pinia).

---

## Local Development (Quickstart)

We provide a convenience script `./start.sh` to run the development database container and setup/start the application locally:

```bash
# Start Postgres in Docker, run migrations, run seeders, and launch both frontend/backend in dev mode
./start.sh --reset
```

See [backend/README.md](file:///Users/dex/Documents/Nutrisipe-Revamp/backend/README.md) and [frontend/README.md](file:///Users/dex/Documents/Nutrisipe-Revamp/frontend/README.md) for deeper details on running manually.

---

## Production Deployment (Docker Compose)

The entire stack is containerized and can be launched on any host via Docker Compose.

### 1. Configure Environment
Copy the example root environment file and customize the variables:

```bash
cp .env.example .env
```

| Env Variable | Description | Default / Example |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL superuser username | `nutrisipe` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | `password123` |
| `POSTGRES_DB` | PostgreSQL production database name | `nutrisipe_prod` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | (Generate a strong 32+ char key) |
| `CORS_ORIGIN` | Allowed CORS origins for backend (defaults to wildcard) | `*` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID for login authentication | `your-google-client-id...` |
| `PUBLIC_URL` | Base public URL of server (optional, for OG metadata) | `http://localhost` |

### 2. Build and Start Services
Compile the production Docker images and launch the containers:

```bash
docker compose build
docker compose up -d
```

Once started, the application will be accessible at:
- Frontend: `http://localhost`
- Backend API: `http://localhost/api` (proxied by Nginx)
- Realtime WS: `http://localhost/socket.io` (proxied by Nginx)

### 3. Run Database Migrations and Seed Data (Optional)
To populate the production PostgreSQL database with the complete suite of rich mock data (admin/demo accounts, comments, variation chains, collections, direct messages, stories):

```bash
docker compose --profile seed run --rm seed
```

---

## Operations & Maintenance

### Uploads & Data Backups
Media files uploaded by users are stored under the `/app/uploads` path in the backend container, mapped to the `uploads_data` Docker volume.
- **Backups:** Remember to back up the named volumes `postgres_data` and `uploads_data` regularly.
- **Example Backup Command:**
  ```bash
  docker run --rm --volumes-from nutrisipe-backend -v $(pwd):/backup alpine tar cvf /backup/uploads-backup.tar /app/uploads
  ```

---

## Security Notes

### JWT in localStorage Risk
The frontend stores the JWT in `localStorage` for session persistence.
- **Risk:** `localStorage` is vulnerable to Cross-Site Scripting (XSS) attacks. If an attacker runs malicious JS, they can read the token.
- **Mitigation:** The application uses `DOMPurify` to sanitize inputs and prevent XSS.
- **Recommendation:** For production deployments, implement a strict Content Security Policy (CSP) on the Nginx/reverse-proxy layer and consider migrating authentication to HttpOnly cookies.
