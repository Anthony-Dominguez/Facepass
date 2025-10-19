from typing import Optional

from pydantic import BaseModel


class RegisterRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    image_base64: Optional[str] = None


class LoginRequest(BaseModel):
    password: Optional[str] = None
    image_base64: Optional[str] = None


class VerifyFaceRequest(BaseModel):
    image_a_base64: Optional[str] = None
    image_b_base64: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    matched: bool = True

    model_config = {"from_attributes": True}
