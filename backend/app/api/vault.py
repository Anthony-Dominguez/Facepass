from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..api.deps import get_current_user
from ..db.session import get_db
from ..models import Credential, User
from ..schemas.vault import VaultEntryCreate, VaultEntryDetail, VaultEntrySummary
from ..services import security, vault

router = APIRouter(prefix="/vault", tags=["vault"])


@router.get("", response_model=List[VaultEntrySummary])
async def list_vault_entries(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entries = (
        db.query(Credential)
        .filter(Credential.user_id == user.id)
        .order_by(Credential.created_at.desc())
        .all()
    )
    return entries


@router.post("", response_model=VaultEntrySummary, status_code=status.HTTP_201_CREATED)
async def create_vault_entry(
    payload: VaultEntryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name is required.")

    category_normalized = vault.normalize_category(payload.category)
    fields_model = vault.validate_fields(category_normalized, payload.fields or {})
    identifier = vault.derive_identifier(category_normalized, fields_model)
    secret_blob = vault.serialize_fields(fields_model)
    password_encrypted = await run_in_threadpool(security.encrypt_secret, secret_blob)

    credential = Credential(
        user_id=user.id,
        name=payload.name.strip(),
        username=identifier.strip() or category_normalized.upper(),
        password_encrypted=password_encrypted,
        category=category_normalized,
    )

    db.add(credential)
    db.commit()
    db.refresh(credential)
    return credential


@router.get("/{entry_id}", response_model=VaultEntryDetail)
async def get_vault_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(Credential)
        .filter(Credential.user_id == user.id, Credential.id == entry_id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found.")
    decrypted = await run_in_threadpool(security.decrypt_secret, entry.password_encrypted)
    fields = vault.parse_secret_blob(decrypted)
    return {
        "id": entry.id,
        "name": entry.name,
        "username": entry.username,
        "category": entry.category,
        "created_at": entry.created_at,
        "fields": fields,
    }


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vault_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(Credential)
        .filter(Credential.user_id == user.id, Credential.id == entry_id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found.")
    db.delete(entry)
    db.commit()
    return None
