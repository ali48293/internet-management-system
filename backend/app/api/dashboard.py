from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.database import get_db
from app.core import security

router = APIRouter()

@router.get("/", response_model=schemas.DashboardData)
def get_dashboard_data(db: Session = Depends(get_db)):
    total_loopers = db.query(models.Looper).filter(models.Looper.is_deleted == False).count()
    active_loopers = db.query(models.Looper).filter(models.Looper.is_active == True, models.Looper.is_deleted == False).count()
    inactive_loopers = total_loopers - active_loopers
    
    total_revenue = db.query(func.sum(models.Payment.amount)).scalar() or 0.0
    total_packages = db.query(func.sum(models.Purchase.snapshot_price)).scalar() or 0.0
    total_products = db.query(func.sum(models.Product.price)).scalar() or 0.0
    
    total_remaining_balance = (total_packages + total_products) - total_revenue
    
    # Calculate Active Users (active in last 5 minutes)
    from datetime import datetime, timedelta
    active_threshold = datetime.utcnow() - timedelta(minutes=5)
    active_users_count = db.query(models.User).filter(models.User.last_active_at >= active_threshold).count()
    
    return schemas.DashboardData(
        total_loopers=total_loopers,
        active_loopers=active_loopers,
        inactive_loopers=inactive_loopers,
        total_revenue=total_revenue,
        total_remaining_balance=total_remaining_balance,
        active_users_count=active_users_count
    )
