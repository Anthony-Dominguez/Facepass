import hashlib
from datetime import datetime, timedelta

import bcrypt
from cryptography.fernet import Fernet
from jose import jwt

from ..core import config

if config.VAULT_KEY_ENV:
    VAULT_CIPHER = Fernet(config.VAULT_KEY_ENV.encode("utf-8"))
else:
    VAULT_CIPHER = Fernet(config.derived_vault_key())


def hash_username(username: str) -> str:
    return hashlib.sha256(username.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def encrypt_secret(secret: str) -> str:
    return VAULT_CIPHER.encrypt(secret.encode("utf-8")).decode("utf-8")


def decrypt_secret(secret_encrypted: str) -> str:
    return VAULT_CIPHER.decrypt(secret_encrypted.encode("utf-8")).decode("utf-8")


def create_access_token(user_id: int, expires_minutes: int = config.ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
    }
    return jwt.encode(to_encode, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
