from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.trusted_contact import TrustedContact
from app.schemas.contact import TrustedContactCreate, TrustedContactUpdate, TrustedContactOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["Trusted Contacts"])


@router.get("", response_model=List[TrustedContactOut])
def list_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TrustedContact).filter(TrustedContact.user_id == current_user.user_id).all()


@router.post("", response_model=TrustedContactOut, status_code=201)
def create_contact(payload: TrustedContactCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contact = TrustedContact(user_id=current_user.user_id, **payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/{contact_id}", response_model=TrustedContactOut)
def update_contact(contact_id: int, payload: TrustedContactUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contact = db.query(TrustedContact).filter(
        TrustedContact.contact_id == contact_id, TrustedContact.user_id == current_user.user_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contact = db.query(TrustedContact).filter(
        TrustedContact.contact_id == contact_id, TrustedContact.user_id == current_user.user_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return None
