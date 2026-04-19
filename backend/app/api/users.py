from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.core import security
from backend.app.api.loopers import log_activity

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.check_role(["superuser"]))
):
    return db.query(models.User).all()

@router.post("/", response_model=schemas.User)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.check_role(["superuser"]))
):
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_pw = security.get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        hashed_password=hashed_pw,
        role=user_in.role,
        looper_id=user_in.looper_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_activity(db, current_user.id, "Create User", f"Created user: {db_user.username} (Role: {db_user.role})")
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.check_role(["superuser"]))
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.password:
        db_user.hashed_password = security.get_password_hash(user_in.password)
    if user_in.role:
        db_user.role = user_in.role
    if user_in.is_active is not None:
        db_user.is_active = user_in.is_active
    if user_in.looper_id is not None:
        db_user.looper_id = user_in.looper_id
        
    db.commit()
    db.refresh(db_user)
    
    log_activity(db, current_user.id, "Update User", f"Updated user: {db_user.username}")
    return db_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.check_role(["superuser"]))
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete current logged-in superuser")
        
    db.delete(db_user)
    db.commit()
    
    log_activity(db, current_user.id, "Delete User", f"Deleted user: {db_user.username}")
    return {"detail": "User deleted successfully"}
