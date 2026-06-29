from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TrustedContact(Base):
    __tablename__ = "trusted_contacts"

    contact_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    contact_name = Column(String(120), nullable=False)
    relation = Column(String(60), nullable=True)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(150), nullable=True)
    is_primary = Column(Boolean, default=False)

    user = relationship("User", back_populates="trusted_contacts")
