<!-- Copyright (c) 2026 XynaxDev | Contact: akashkumar.cs27@gmail.com -->

# Tunnel Setup Guide: Local vs Hosted

This guide explains exactly **when**, **where**, and **what** to change so your frontend (ngrok) and backend (Dev Tunnels) work correctly.

## 1. Why your hosted auth was failing

Your frontend built URLs as:

- `VITE_API_URL` ended with `/`
- API endpoint also started with `/auth/...`

So requests became `//auth/signup` and `//auth/google`, which caused `404 Not Found` on backend.

## 2. Files you must know

- Frontend env: `frontend/.env.local`
- Frontend API client: `frontend/src/lib/api.ts`
- Backend auth router: `backend/app/routers/auth.py`
- (Optional) frontend dev host settings: `frontend/vite.config.ts`

## 3. Local mode (everything on localhost)

Use this when both frontend and backend are running on your machine.

### 3.1 Frontend env

File: `frontend/.env.local`

```env
VITE_API_URL=http://localhost:8000
```

Important: no trailing slash.

### 3.2 Frontend API URL join safety

File: `frontend/src/lib/api.ts`

Keep this pattern:

```ts
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
const response = await fetch(`${API_BASE}${path}`, config);
```

This permanently prevents accidental double slashes.

### 3.3 Google callback for local login

File: `backend/app/routers/auth.py`

For local mode, callback should be:

```py
"redirect_to": "http://localhost:5173/auth/callback"
```

### 3.4 Start services

Backend:

```powershell
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

## 4. Hosted mode (frontend via ngrok, backend via Dev Tunnels)

Use this when others access your app through internet URLs.

### 4.1 Frontend env

File: `frontend/.env.local`

```env
VITE_API_URL=https://<your-backend>.devtunnels.ms
```

Example:

```env
VITE_API_URL=https://6b88kn0l-8000.inc1.devtunnels.ms
```

Important: no trailing slash.

### 4.2 Google callback for hosted frontend

File: `backend/app/routers/auth.py`

Set callback to your ngrok frontend URL:

```py
"redirect_to": "https://<your-frontend>.ngrok-free.app/auth/callback"
```

### 4.3 Supabase Auth settings (required)

Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL: `https://<your-frontend>.ngrok-free.app`
- Redirect URLs add:
  - `https://<your-frontend>.ngrok-free.app/auth/callback`
  - `http://localhost:5173/auth/callback` (optional, for local dev)

If this is missing, Google OAuth can fail even if backend code is correct.

## 5. When to change what

### You changed backend tunnel URL

Change only:

- `frontend/.env.local` -> `VITE_API_URL`

Then restart frontend.

### You changed frontend ngrok URL

Change:

- `backend/app/routers/auth.py` -> `redirect_to`
- Supabase -> Site URL and Redirect URLs

Then restart backend.

### You switched local <-> hosted

Change both:

- `frontend/.env.local` -> `VITE_API_URL`
- `backend/app/routers/auth.py` -> OAuth `redirect_to`
- Supabase redirect URLs (if hosted OAuth is used)

Then restart both frontend and backend.

## 6. Quick verification checklist

After changes, verify all of these:

1. In browser DevTools Network, auth calls are `.../auth/signup` (single slash), not `//auth/signup`.
2. Backend logs show:
   - `POST /auth/signup` (not `POST //auth/signup`)
   - `GET /auth/google` (not `GET //auth/google`)
3. Opening Google auth flow redirects back to `/auth/callback` correctly.
4. `VITE_API_URL` has no trailing `/`.

## 7. Common mistakes

- Keeping trailing slash in `VITE_API_URL`.
- Forgetting to restart Vite after editing `.env.local`.
- Updating ngrok URL in backend but not in Supabase redirect settings.
- Using local callback URL while testing hosted frontend.

## 8. Recommended improvement (future-proof)

Instead of hardcoding callback URL in `auth.py`, read it from backend env:

- Add in `backend/.env`:

```env
FRONTEND_CALLBACK_URL=https://<your-frontend>.ngrok-free.app/auth/callback
```

- Use this variable in code for `redirect_to`.

This way switching URLs is easier and safer.



