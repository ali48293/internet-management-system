from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.core import security
from backend.app.core.config import settings
from backend.app.database import get_db
from backend.app import models, schemas

router = APIRouter()

@router.post("/token")
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log Activity
    new_log = models.ActivityLog(
        user_id=user.id,
        action="Login",
        details=f"User {user.username} logged in successfully."
    )
    db.add(new_log)
    db.commit()
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    # Log Activity
    new_log = models.ActivityLog(
        user_id=current_user.id,
        action="Logout",
        details=f"User {current_user.username} logged out."
    )
    db.add(new_log)
    
    # Nullify last_active_at on explicit logout
    current_user.last_active_at = None
    
    db.commit()
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user
