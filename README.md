# FacePass Monorepo

Two-part project combining a FastAPI backend with a T3/Next.js frontend.

## Structure

```
backend/   # FastAPI service (register/login/verify/vault)
└── app/
    ├── main.py      # application entrypoint
    └── templates/   # demo HTML page served by the backend

web/       # Next.js 15 app (marketing site + biometric auth UI)
```

## Getting started

1. **Backend**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn backend.app.main:app --reload
   ```

2. **Frontend**
   ```bash
   cd web
   cp .env.local.example .env.local  # adjust API base URL if needed
   npm install
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) for the marketing site, `/auth` for the biometric onboarding flow, and `/vault` for the password manager.

## Notes

- The backend stores secrets in `backend/app.db` (SQLite by default). Delete that file to reset the demo database.
- Environment variables for the backend are documented in `backend/README.md`; frontend variables live in `web/.env.local`.
