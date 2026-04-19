from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.database import get_db
from app.core import security
from app.api.loopers import log_activity
import os
import uuid
import shutil
from app.core.config import settings
from app.utils.storage import upload_file

router = APIRouter()

@router.post("/", response_model=schemas.Payment)
def create_payment(
    looper_id: int = Form(...),
    amount: float = Form(...),
    receipt: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_looper = db.query(models.Looper).filter(models.Looper.id == looper_id).first()
    if not db_looper:
        raise HTTPException(status_code=404, detail="Looper not found")
    
    receipt_url = None
    if receipt:
        receipt_url = upload_file(receipt, "receipts")
        
    db_payment = models.Payment(
        looper_id=looper_id,
        amount=amount,
        receipt_url=receipt_url
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    
    log_activity(db, current_user.id, "Add Payment", f"Added payment of {db_payment.amount} for looper ID {looper_id}")
    return db_payment

@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    db.delete(db_payment)
    db.commit()
    
    log_activity(db, current_user.id, "Delete Payment", f"Deleted payment ID: {payment_id}")
    return {"detail": "Payment record deleted successfully"}
