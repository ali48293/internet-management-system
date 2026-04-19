from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.core import security
from backend.app.api.loopers import log_activity # Reuse from loopers.py

router = APIRouter()

@router.get("/", response_model=List[schemas.Package])
def get_packages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    packages = db.query(models.Package).offset(skip).limit(limit).all()
    return packages

@router.post("/", response_model=schemas.Package)
def create_package(package: schemas.PackageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_package = models.Package(**package.model_dump())
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    
    log_activity(db, current_user.id, "Create Package", f"Created package: {db_package.name}")
    return db_package

@router.put("/{package_id}", response_model=schemas.Package)
def update_package(package_id: int, package: schemas.PackageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_package = db.query(models.Package).filter(models.Package.id == package_id).first()
    if not db_package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    db_package.name = package.name
    db_package.price = package.price
    db_package.data_amount_mb = package.data_amount_mb
    db.commit()
    db.refresh(db_package)
    
    log_activity(db, current_user.id, "Update Package", f"Updated package: {db_package.name} (ID: {package_id})")
    return db_package

@router.delete("/{package_id}")
def delete_package(package_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_package = db.query(models.Package).filter(models.Package.id == package_id).first()
    if not db_package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Check if package is used in purchases
    active_purchases = db.query(models.Purchase).filter(models.Purchase.package_id == package_id).count()
    if active_purchases > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete package. It is used in {active_purchases} purchases.")
        
    db.delete(db_package)
    db.commit()
    
    log_activity(db, current_user.id, "Delete Package", f"Deleted package: {db_package.name}")
    return {"detail": "Package deleted successfully"}
