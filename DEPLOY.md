# Deployment Guide

## Architecture

- **Backend**: FastAPI on Railway (Docker)
- **Frontend**: Next.js on Vercel
- **Database**: PostgreSQL via Railway plugin

---

## Environment Variables

### Railway (Backend)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Railway plugin) | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Long random string for JWT signing | `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console OAuth credentials | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console OAuth credentials | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Must match exactly what's in Google Cloud Console | `https://your-backend.railway.app/api/v1/auth/google/callback` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | `https://your-app.vercel.app` |
| `FRONTEND_URL` | Base URL of the deployed frontend | `https://your-app.vercel.app` |

> **Note on DATABASE_URL**: Railway auto-injects `DATABASE_URL` when you attach a PostgreSQL plugin, but the format is `postgresql://...`. The app requires `postgresql+asyncpg://...` for async SQLAlchemy. Either set it manually with the `+asyncpg` driver prefix, or add a `DATABASE_URL` override in Railway's variable editor.

### Vercel (Frontend)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Full base URL of the deployed Railway backend | `https://your-backend.railway.app` |

---

## Railway Deployment Steps

1. **Create a Railway project**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
   - Select this repository

2. **Add PostgreSQL**
   - In the project dashboard → New → Database → Add PostgreSQL
   - Railway will inject `DATABASE_URL` automatically

3. **Configure the service**
   - Railway auto-detects `railway.toml` and uses `backend/Dockerfile.railway`
   - Set the root directory to `/` (the repo root, not `/backend`) — the Dockerfile path in `railway.toml` handles the rest

4. **Set environment variables**
   - In the service settings → Variables, add all variables from the table above
   - Make sure `DATABASE_URL` uses the `postgresql+asyncpg://` prefix

5. **Deploy**
   - Railway triggers a build automatically on push, or click "Deploy" manually
   - Watch the build logs; the health check at `/health` must return 200 before traffic routes

6. **Run database migrations**
   - Once deployed, open the Railway service shell (Settings → Shell)
   - Run: `alembic upgrade head`
   - This applies all migrations to the production database

---

## Vercel Deployment Steps

1. **Import the repository**
   - Go to [vercel.com](https://vercel.com) → New Project → Import Git Repository
   - Select this repository

2. **Set the root directory**
   - In the project configuration, set **Root Directory** to `frontend`
   - Vercel will pick up `frontend/vercel.json` for build settings

3. **Set environment variables**
   - Add `NEXT_PUBLIC_API_URL` pointing to your Railway backend URL (no trailing slash)
   - Example: `https://your-backend.railway.app`

4. **Deploy**
   - Click Deploy — Vercel builds and serves the Next.js app
   - Subsequent pushes to `main` auto-deploy

---

## Google Cloud Console Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add your production callback URL:
   ```
   https://your-backend.railway.app/api/v1/auth/google/callback
   ```
4. Keep `http://localhost:8000/api/v1/auth/google/callback` for local dev
5. Save and wait ~5 minutes for changes to propagate

---

## Local Development

Create `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/budget_tracker
SECRET_KEY=your-local-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
