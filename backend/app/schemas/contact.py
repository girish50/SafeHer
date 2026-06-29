from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional


class TrustedContactCreate(BaseModel):
    contact_name: str
    relation: Optional[str] = None
    phone_number: str
    email: Optional[EmailStr] = None
    is_primary: bool = False


class TrustedContactUpdate(BaseModel):
    contact_name: Optional[str] = None
    relation: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    is_primary: Optional[bool] = None


class TrustedContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    contact_id: int
    contact_name: str
    relation: Optional[str] = None
    phone_number: str
    email: Optional[str] = None
    is_primary: bool
