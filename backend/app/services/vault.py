import json
from typing import Any, Dict

from fastapi import HTTPException, status
from pydantic import ValidationError

from ..schemas.vault import CATEGORY_SCHEMAS


def normalize_category(category: str) -> str:
    normalized = category.strip().lower()
    if normalized not in CATEGORY_SCHEMAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category must be one of: {', '.join(sorted(CATEGORY_SCHEMAS))}.",
        )
    return normalized


def validate_fields(category: str, fields: Dict[str, Any]):
    schema = CATEGORY_SCHEMAS[category]
    try:
        model = schema(**fields)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.errors(),
        ) from exc

    if category == "email":
        email_value = getattr(model, "email", "")
        if "@" not in email_value or "." not in email_value.split("@")[-1]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid email address is required.",
            )
    return model


def derive_identifier(category: str, payload) -> str:
    identifier_getter = getattr(type(payload), "identifier", None)
    if callable(identifier_getter):
        identifier = identifier_getter(payload)
        if identifier:
            return identifier

    dump = payload.model_dump()
    for key in ("username", "email", "member_id", "id_number"):
        if dump.get(key):
            return dump[key]
    return category.upper()


def serialize_fields(model) -> str:
    return json.dumps(model.model_dump())


def parse_secret_blob(blob: str) -> Dict[str, Any]:
    try:
        data = json.loads(blob)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    return {"secret": blob}
