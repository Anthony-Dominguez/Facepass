## FacePass Backend

FastAPI service that powers biometric registration, authentication, and the encrypted password vault.

### Project layout

```
backend/
├── app/
│   ├── __init__.py   # exposes FastAPI instance
│   ├── main.py       # application entrypoint, routes, models, services
│   └── templates/    # legacy HTML template (used for the demo landing page)
├── app.db            # default SQLite database (generated at runtime)
└── requirements.txt  # backend dependencies
```

### Running locally

1. **Install dependencies**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Start the API**
   ```bash
   # from the repo root
   uvicorn backend.app.main:app --reload

   # or from inside backend/
   uvicorn app.main:app --reload
   ```

   The server listens on `http://localhost:8000` by default and automatically creates `backend/app.db` (unless `DATABASE_URL` is set).

### Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy connection string | SQLite file in `backend/app.db` |
| `JWT_SECRET` | Secret for signing access tokens | `change-me` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime in minutes | `60` |
| `VAULT_KEY` | Fernet key for encrypting secrets (falls back to JWT secret if omitted) | derived from `JWT_SECRET` |
| `ALLOWED_ORIGINS` | Comma-separated list of origins for CORS | `http://localhost:3000,http://127.0.0.1:3000` |

### Database location

If you need to wipe the demo data, delete `backend/app.db` (or point `DATABASE_URL` to a different database) before restarting the server.
