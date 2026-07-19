# Deploy CYBERNERDS OWASP Recruitment App

This project has two parts:

| Part | Host | Why |
|------|------|-----|
| Frontend (React / Vite) | **Vercel** | Static SPA |
| Backend (Express + MongoDB + Socket.io) | **Render / Railway** (or similar) | Needs a long-running Node server |

Vercel alone cannot host the Express API with Socket.io and file uploads.

---

## 1) Deploy backend first (Render example)

1. Push the repo to GitHub.
2. Create a **Web Service** on [Render](https://render.com).
3. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Environment variables (from `server/.env.example`):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `GOOGLE_CLIENT_ID`
   - `FRONTEND_URL` → your Vercel URL (add after frontend deploy, then redeploy backend)
5. Copy the backend URL, e.g. `https://cybernerds-api.onrender.com`

---

## 2) Deploy frontend on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Framework: **Vite** (auto-detected).
3. Root directory: project root (not `server`).
4. Build: `npm run build` · Output: `dist`
5. Environment variables:
   - `VITE_API_URL` = your backend URL (no trailing slash)
   - `VITE_GOOGLE_CLIENT_ID` = Google OAuth Web Client ID (optional if already baked in)
6. Deploy.

`vercel.json` already rewrites routes for React Router.

---

## 3) Google OAuth (required for login)

In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your OAuth client:

**Authorized JavaScript origins**
- `http://localhost:5173`
- `https://your-app.vercel.app`

**Authorized redirect URIs** (if used)
- `http://localhost:5173`
- `https://your-app.vercel.app`

---

## 4) Final wiring

1. Set backend `FRONTEND_URL` to the Vercel URL.
2. Redeploy backend.
3. Confirm frontend `VITE_API_URL` matches the backend URL.
4. Redeploy frontend if you change env vars (Vite embeds them at build time).

---

## Local check before deploy

```bash
# Frontend
npm install
npm run build

# Backend
cd server
npm install
npm start
```

Then open the Vercel site and test login + apply.
