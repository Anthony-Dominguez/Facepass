#!/bin/bash
set -e

echo "Starting FacePass Backend..."

# Run database migrations if using Alembic (future)
# alembic upgrade head

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
