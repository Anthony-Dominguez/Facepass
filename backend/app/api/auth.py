import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..api.deps import get_current_user
from ..core.rate_limit import limiter
from ..db.session import get_db
from ..models import User
from ..schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    VerifyFaceRequest,
)
from ..services import face, security

router = APIRouter(tags=["auth"])


@router.post("/register")
@limiter.limit("3/minute")  # 3 registration attempts per minute
async def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    if not payload.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required."
        )
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Password is required."
        )
    if not payload.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Face image is required."
        )

    username_hash = await run_in_threadpool(security.hash_username, payload.username)
    existing_user = db.query(User).filter(User.username_hash == username_hash).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered."
        )

    password_hash = await run_in_threadpool(security.hash_password, payload.password)

    try:
        embedding = await run_in_threadpool(face.compute_embedding, payload.image_base64, True)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    users: List[User] = db.query(User).all()
    for candidate in users:
        stored_embedding = json.loads(candidate.face_embedding)
        if face.embeddings_match(embedding, stored_embedding):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Face already registered."
            )

    user = User(
        username_hash=username_hash,
        face_embedding=json.dumps(embedding),
        password_hash=password_hash,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Registration successful.", "user_id": user.id}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Password is required."
        )
    if not payload.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Face image is required."
        )

    try:
        incoming_embedding = await run_in_threadpool(face.compute_embedding, payload.image_base64, False)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    users = db.query(User).all()
    for candidate in users:
        stored_embedding = json.loads(candidate.face_embedding)
        if not face.embeddings_match(incoming_embedding, stored_embedding):
            continue
        if security.verify_password(payload.password, candidate.password_hash):
            token = security.create_access_token(user_id=candidate.id)
            return TokenResponse(access_token=token, matched=True)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")


@router.post("/verify-face")
@limiter.limit("10/minute")  # 10 face verification attempts per minute
async def verify_face(request: Request, payload: VerifyFaceRequest):
    if not payload.image_a_base64 or not payload.image_b_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Both face images are required."
        )

    try:
        embedding_a = await run_in_threadpool(face.compute_embedding, payload.image_a_base64, False)
        embedding_b = await run_in_threadpool(face.compute_embedding, payload.image_b_base64, False)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    match = face.embeddings_match(embedding_a, embedding_b)
    return {"match": match}


@router.get("/me")
async def read_current_user(user: User = Depends(get_current_user)):
    return {"user_id": user.id}
