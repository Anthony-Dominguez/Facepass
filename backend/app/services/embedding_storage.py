"""
Secure embedding storage layer.

This module provides encryption/decryption for face embeddings with a clean API.
It abstracts the storage format and encryption details from the rest of the application.
"""
import json
import logging
from typing import List

from cryptography.fernet import InvalidToken

from .security import decrypt_secret, encrypt_secret

logger = logging.getLogger(__name__)

# Expected embedding dimension (adjust based on your face recognition model)
# DeepFace with default model typically produces 128 or 512 dimensional embeddings
MAX_EMBEDDING_DIM = 4096  # Safety upper limit to prevent DoS attacks


def encrypt_embedding(embedding: List[float]) -> str:
    """
    Encrypt a face embedding for secure storage.

    Args:
        embedding: Face embedding as list of floats

    Returns:
        Encrypted string suitable for database storage

    Raises:
        ValueError: If embedding format is invalid

    Example:
        >>> embedding = [0.1, 0.2, 0.3, ...]
        >>> encrypted = encrypt_embedding(embedding)
        >>> # Store encrypted in database
    """
    # Validate before encryption
    validate_embedding_format(embedding)

    # Reuse existing encryption from security module
    return encrypt_secret(json.dumps(embedding))


def decrypt_embedding(stored_value: str) -> List[float]:
    """
    Decrypt a face embedding from secure storage.

    Decrypts stored string and returns embedding as list of floats.

    Args:
        stored_value: Encrypted embedding string from database

    Returns:
        Decrypted face embedding as list of floats

    Raises:
        ValueError: If decryption fails or data is corrupted

    Example:
        >>> encrypted = user.face_embedding
        >>> embedding = decrypt_embedding(encrypted)
        >>> # Use embedding for comparison
    """
    try:
        # Reuse existing decryption from security module
        decrypted = decrypt_secret(stored_value)
        embedding = json.loads(decrypted)

        # Validate format after decryption
        if not isinstance(embedding, list):
            raise ValueError("Embedding must be a list")

        return embedding

    except InvalidToken as exc:
        logger.warning(
            "Failed to decrypt embedding: invalid token or corrupted data",
            extra={"error_type": "decryption_failure"}
        )
        raise ValueError("Unable to decrypt embedding: data may be corrupted") from exc
    except json.JSONDecodeError as exc:
        logger.warning(
            "Failed to parse embedding: invalid JSON format",
            extra={"error_type": "json_parse_failure"}
        )
        raise ValueError("Unable to parse embedding: invalid data format") from exc
    except (UnicodeDecodeError, AttributeError) as exc:
        logger.warning(
            "Failed to decode embedding: invalid encoding",
            extra={"error_type": "decode_failure"}
        )
        raise ValueError("Unable to decode embedding: invalid encoding") from exc


def validate_embedding_format(embedding: List[float]) -> None:
    """
    Validate that an embedding has the expected format.

    Args:
        embedding: Face embedding to validate

    Raises:
        ValueError: If embedding format is invalid
    """
    if not isinstance(embedding, list):
        raise ValueError("Embedding must be a list")

    if len(embedding) == 0:
        raise ValueError("Embedding cannot be empty")

    if len(embedding) > MAX_EMBEDDING_DIM:
        raise ValueError(f"Embedding too large: max {MAX_EMBEDDING_DIM} dimensions")

    if not all(isinstance(x, (int, float)) for x in embedding):
        raise ValueError("Embedding must contain only numbers")

    # Validate numeric values are reasonable (normalized embeddings)
    for value in embedding:
        if not (-1e6 < value < 1e6):
            raise ValueError("Embedding contains out-of-range values")
