from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username_hash = Column(String, unique=True, nullable=False, index=True)
    face_embedding = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)

    credentials = relationship(
        "Credential", back_populates="user", cascade="all, delete-orphan"
    )
