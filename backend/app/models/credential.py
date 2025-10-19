from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from datetime import datetime

from ..db.session import Base


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    username = Column(String, nullable=False)
    password_encrypted = Column(String, nullable=False)
    category = Column(String, nullable=False, default="login")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="credentials")
