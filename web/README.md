## FacePass Vault Frontend

This folder contains the T3-flavoured Next.js frontend for the FastAPI + DeepFace authentication server. Once authenticated, it provides a polished password vault UI that talks directly to the `/register`, `/login`, and `/vault` endpoints exposed by the backend.

### 1. Environment

Create a `.env.local` file in this directory and point the app at your FastAPI instance (defaults to `http://localhost:8000` if omitted):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser that can access your webcam. The marketing homepage lives at `/`, biometric onboarding at `/auth`, and the password vault at `/vault` (redirects to `/auth` if you are not logged in).

### Production build

```bash
npm run build
npm start
```

> **Tip:** The UI assumes the FastAPI server enforces the “clear face” policy and exposes the `/vault` endpoints defined in `backend/app/main.py`.
