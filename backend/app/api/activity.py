from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.core import security

router = APIRouter()

@router.get("/", response_model=List[schemas.ActivityLog])
def get_activity_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.check_role(["superuser"]))
):
    query = db.query(models.ActivityLog, models.User.username).join(models.User, models.ActivityLog.user_id == models.User.id)
    
    if user_id:
        query = query.filter(models.ActivityLog.user_id == user_id)
    if action:
        query = query.filter(models.ActivityLog.action.ilike(f"%{action}%"))
        
    results = query.order_by(models.ActivityLog.created_at.desc()).limit(100).all()
    
    # Flatten results for schema
    logs = []
    for log, username in results:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "username": username,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at
        }
        logs.append(log_dict)
        
    return logs
