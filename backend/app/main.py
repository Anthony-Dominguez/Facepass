from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .api import auth, root, vault
from .core import config
from .core.rate_limit import limiter
from .db.session import Base, engine
from .models import Credential, User  # noqa: F401  (register models)


def create_app() -> FastAPI:
    app = FastAPI(title="DeepFace Auth Demo")

    # Add rate limiter to app state
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(root.router)
    app.include_router(auth.router)
    app.include_router(vault.router)

    @app.on_event("startup")
    def startup() -> None:
        config.TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

    return app


# Create database tables on import
Base.metadata.create_all(bind=engine)

app = create_app()

__all__ = ["app"]
