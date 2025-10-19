from datetime import datetime
from typing import Any, Dict, Optional, Type

from pydantic import BaseModel


class VaultEntryCreate(BaseModel):
    name: str
    category: str
    fields: Dict[str, Any]


class VaultEntrySummary(BaseModel):
    id: int
    name: str
    username: str
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class VaultEntryDetail(VaultEntrySummary):
    fields: Dict[str, Any]


class LoginFields(BaseModel):
    username: str
    password: str

    @classmethod
    def identifier(cls, data: "LoginFields") -> str:
        return data.username


class EmailFields(BaseModel):
    email: str
    password: str

    @classmethod
    def identifier(cls, data: "EmailFields") -> str:
        return data.email


class CreditCardFields(BaseModel):
    cardholder_name: str
    number: str
    expiry_month: str
    expiry_year: str
    cvv: str
    network: Optional[str] = None

    @classmethod
    def identifier(cls, data: "CreditCardFields") -> str:
        digits = "".join(ch for ch in data.number if ch.isdigit())
        last4 = digits[-4:] if len(digits) >= 4 else digits
        return f"•••• {last4}" if last4 else "Card"


class IDFields(BaseModel):
    document_type: str
    id_number: str
    country: str
    expiration_date: Optional[str] = None

    @classmethod
    def identifier(cls, data: "IDFields") -> str:
        return f"{data.document_type.upper()} {data.id_number}"


class MedicalFields(BaseModel):
    provider: str
    member_id: str
    plan_name: Optional[str] = None
    group_number: Optional[str] = None
    notes: Optional[str] = None

    @classmethod
    def identifier(cls, data: "MedicalFields") -> str:
        return data.member_id or data.provider


CATEGORY_SCHEMAS: Dict[str, Type[BaseModel]] = {
    "login": LoginFields,
    "email": EmailFields,
    "credit_card": CreditCardFields,
    "id": IDFields,
    "medical": MedicalFields,
}
