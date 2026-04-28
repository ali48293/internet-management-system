from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.core import security
import os
import uuid
import shutil
from backend.app.core.config import settings
from backend.app.utils.storage import upload_file
import csv
import io
from fastapi.responses import StreamingResponse
from datetime import datetime, date
import re
from urllib.parse import quote
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from bidi.algorithm import get_display
import logging

logger = logging.getLogger(__name__)

# Font registration for Urdu support
FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "fonts")
FONT_PATH = os.path.join(FONT_DIR, "FreeSans.ttf")

DEFAULT_FONT = 'Helvetica'
try:
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont('UnicodeFont', FONT_PATH))
        DEFAULT_FONT = 'UnicodeFont'
    else:
        # Debugging: check current directory and parent
        logger.warning(f"Font file not found at {FONT_PATH}. Current dir: {os.getcwd()}, dir(__file__): {os.path.dirname(__file__)}")
except Exception as e:
    logger.error(f"Failed to register font: {str(e)}")

def format_pdf_text(text: str) -> str:
    """Reshapes and applies BIDI to text if it contains Urdu/Arabic characters."""
    if not text:
        return ""
    # Check if text contains non-ASCII characters (simplistic check for Urdu/Arabic)
    if any(ord(c) > 127 for c in text):
        try:
            reshaped_text = arabic_reshaper.reshape(text)
            return get_display(reshaped_text)
        except Exception:
            return text
    return text

router = APIRouter()

def log_activity(db: Session, user_id: int, action: str, details: str = None):
    log = models.ActivityLog(user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()

def calculate_balance(db: Session, looper_id: int) -> float:
    purchases_sum = db.query(func.sum(models.Purchase.snapshot_price)).filter(models.Purchase.looper_id == looper_id).scalar() or 0.0
    products_sum = db.query(func.sum(models.Product.price)).filter(models.Product.looper_id == looper_id).scalar() or 0.0
    payments_sum = db.query(func.sum(models.Payment.amount)).filter(models.Payment.looper_id == looper_id).scalar() or 0.0
    return purchases_sum + products_sum - payments_sum

@router.get("/", response_model=List[schemas.Looper])
def get_loopers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    loopers = db.query(models.Looper).filter(models.Looper.is_deleted == False).order_by(models.Looper.created_at.desc()).offset(skip).limit(limit).all()
    # attach balance and package names
    result = []
    for l in loopers:
        package_names = db.query(models.Purchase.package_name).filter(models.Purchase.looper_id == l.id).distinct().all()
        l_dict = {
            "id": l.id,
            "name": l.name,
            "mobile": l.mobile,
            "is_active": l.is_active,
            "cnic_front_url": l.cnic_front_url,
            "cnic_back_url": l.cnic_back_url,
            "profile_pic_url": l.profile_pic_url,
            "created_at": l.created_at,
            "balance": calculate_balance(db, l.id),
            "package_names": [p[0] for p in package_names]
        }
        result.append(schemas.Looper(**l_dict))
    return result

@router.get("/{looper_id}", response_model=schemas.Looper)
def get_looper(looper_id: int, db: Session = Depends(get_db)):
    db_looper = db.query(models.Looper).filter(models.Looper.id == looper_id, models.Looper.is_deleted == False).first()
    if db_looper is None:
        raise HTTPException(status_code=404, detail="Looper not found or deleted")
    
    l_dict = {
            "id": db_looper.id,
            "name": db_looper.name,
            "mobile": db_looper.mobile,
            "is_active": db_looper.is_active,
            "cnic_front_url": db_looper.cnic_front_url,
            "cnic_back_url": db_looper.cnic_back_url,
            "profile_pic_url": db_looper.profile_pic_url,
            "created_at": db_looper.created_at,
            "balance": calculate_balance(db, db_looper.id)
        }
    return schemas.Looper(**l_dict)

@router.post("/", response_model=schemas.Looper)
def create_looper(
    name: str = Form(...),
    mobile: str = Form(...),
    is_active: bool = Form(True),
    cnic_front: Optional[UploadFile] = File(None),
    cnic_back: Optional[UploadFile] = File(None),
    profile_pic: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(security.get_current_user)
):
    cnic_front_url = upload_file(cnic_front, "cnic") if cnic_front else None
    cnic_back_url = upload_file(cnic_back, "cnic") if cnic_back else None
    profile_pic_url = upload_file(profile_pic, "profiles") if profile_pic else None
    db_looper = models.Looper(
        name=name,
        mobile=mobile,
        is_active=is_active,
        cnic_front_url=cnic_front_url,
        cnic_back_url=cnic_back_url,
        profile_pic_url=profile_pic_url
    )
    db.add(db_looper)
    db.commit()
    db.refresh(db_looper)
    
    log_activity(db, current_user.id, "Create Looper", f"Created looper: {db_looper.name} (ID: {db_looper.id})")
    
    l_dict = {
        "id": db_looper.id,
        "name": db_looper.name,
        "mobile": db_looper.mobile,
        "is_active": db_looper.is_active,
        "cnic_front_url": db_looper.cnic_front_url,
        "cnic_back_url": db_looper.cnic_back_url,
        "profile_pic_url": db_looper.profile_pic_url,
        "created_at": db_looper.created_at,
        "balance": 0.0
    }
    return schemas.Looper(**l_dict)

@router.put("/{looper_id}/status", response_model=schemas.Looper)
def update_looper_status(looper_id: int, is_active: bool, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_looper = db.query(models.Looper).filter(models.Looper.id == looper_id, models.Looper.is_deleted == False).first()
    if db_looper is None:
        raise HTTPException(status_code=404, detail="Looper not found")
    
    db_looper.is_active = is_active
    db.commit()
    db.refresh(db_looper)
    
    log_activity(db, current_user.id, "Update Looper Status", f"Set looper {db_looper.name} status to {'Active' if is_active else 'Inactive'}")
    
    l_dict = {
        "id": db_looper.id,
        "name": db_looper.name,
        "mobile": db_looper.mobile,
        "is_active": db_looper.is_active,
        "cnic_front_url": db_looper.cnic_front_url,
        "cnic_back_url": db_looper.cnic_back_url,
        "profile_pic_url": db_looper.profile_pic_url,
        "is_deleted": db_looper.is_deleted,
        "created_at": db_looper.created_at,
        "balance": calculate_balance(db, db_looper.id)
    }
    return schemas.Looper(**l_dict)

@router.put("/{looper_id}", response_model=schemas.Looper)
def update_looper(
    looper_id: int, 
    name: Optional[str] = Form(None),
    mobile: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    profile_pic: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.check_role(["superuser", "manager"]))
):
    db_looper = db.query(models.Looper).filter(models.Looper.id == looper_id, models.Looper.is_deleted == False).first()
    if db_looper is None:
        raise HTTPException(status_code=404, detail="Looper not found")
    
    if name is not None:
        db_looper.name = name
    if mobile is not None:
        db_looper.mobile = mobile
    if is_active is not None:
        db_looper.is_active = is_active
        
    if profile_pic:
        profile_pic_url = upload_file(profile_pic, "profiles")
        db_looper.profile_pic_url = profile_pic_url
        
    db.commit()
    db.refresh(db_looper)
    
    l_dict = {
        "id": db_looper.id,
        "name": db_looper.name,
        "mobile": db_looper.mobile,
        "is_active": db_looper.is_active,
        "cnic_front_url": db_looper.cnic_front_url,
        "cnic_back_url": db_looper.cnic_back_url,
        "profile_pic_url": db_looper.profile_pic_url,
        "is_deleted": db_looper.is_deleted,
        "created_at": db_looper.created_at,
        "balance": calculate_balance(db, db_looper.id)
    }
    return schemas.Looper(**l_dict)

@router.delete("/{looper_id}")
def delete_looper(looper_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_looper = db.query(models.Looper).filter(models.Looper.id == looper_id, models.Looper.is_deleted == False).first()
    if db_looper is None:
        raise HTTPException(status_code=404, detail="Looper not found")
    
    db_looper.is_deleted = True
    db.commit()
    
    log_activity(db, current_user.id, "Delete Looper", f"Soft-deleted looper: {db_looper.name} (ID: {looper_id})")
    return {"detail": "Looper deleted successfully (soft delete)"}

@router.post("/{looper_id}/purchases", response_model=schemas.Purchase)
def create_purchase(looper_id: int, purchase: schemas.PurchaseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    db_looper = db.query(models.Looper).filter(models.Looper.id == looper_id).first()
    if not db_looper:
        raise HTTPException(status_code=404, detail="Looper not found")
    
    if not db_looper.is_active:
        raise HTTPException(status_code=400, detail="Inactive loopers cannot purchase packages")

    # Extract numerical value from package name (e.g. "10MB" -> 10)
    mb_amount = 0.0
    mb_match = re.search(r'(\d+\.?\d*)', purchase.package_name)
    if mb_match:
        mb_amount = float(mb_match.group(1))
    
    # Calculation: MB * Price (as per user request "500mb and price 100 = 50000")
    calculated_price = mb_amount * purchase.price
    
    db_purchase = models.Purchase(
        looper_id=looper_id,
        package_name=purchase.package_name,
        snapshot_price=calculated_price,
        unit_price=purchase.price
    )
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)
    
    log_activity(db, current_user.id, "Add Package", f"Added package {db_purchase.package_name} to {db_looper.name}")
    return db_purchase

@router.put("/{looper_id}/purchases/{purchase_id}", response_model=schemas.Purchase)
def update_purchase(looper_id: int, purchase_id: int, unit_price: float, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id, models.Purchase.looper_id == looper_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Extract numerical value from package name (e.g. "500MB" -> 500, "1GB" -> 1)
    quantity = 0.0
    if db_purchase.package_name:
        match = re.search(r'(\d+\.?\d*)', db_purchase.package_name)
        if match:
            quantity = float(match.group(1))
    
    # Recalculate total price based on new unit_price
    db_purchase.unit_price = unit_price
    db_purchase.snapshot_price = quantity * unit_price
    
    db.commit()
    db.refresh(db_purchase)
    
    log_activity(db, current_user.id, "Update Purchase", f"Updated rate for purchase {db_purchase.id} to {unit_price}/unit (Total: {db_purchase.snapshot_price})")
    return db_purchase

@router.delete("/{looper_id}/purchases/{purchase_id}")
def delete_purchase(looper_id: int, purchase_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id, models.Purchase.looper_id == looper_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    db.delete(db_purchase)
    db.commit()
    
    log_activity(db, current_user.id, "Delete Purchase", f"Deleted purchase ID: {purchase_id}")
    return {"detail": "Purchase deleted successfully"}

@router.get("/{looper_id}/history")
def get_looper_history(looper_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    purchases = db.query(models.Purchase).filter(models.Purchase.looper_id == looper_id).order_by(models.Purchase.created_at.desc()).all()
    payments = db.query(models.Payment).filter(models.Payment.looper_id == looper_id).order_by(models.Payment.created_at.desc()).all()
    products = db.query(models.Product).filter(models.Product.looper_id == looper_id).order_by(models.Product.created_at.desc()).all()
    
    return {
        "purchases": purchases,
        "payments": payments,
        "products": products
    }

@router.post("/{looper_id}/products", response_model=schemas.Product)
def create_looper_product(
    looper_id: int,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
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
        
    db_product = models.Product(
        looper_id=looper_id,
        name=name,
        description=description,
        price=price,
        receipt_url=receipt_url
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    log_activity(db, current_user.id, "Sell Product", f"Sold product {db_product.name} to looper ID {looper_id} for {db_product.price}")
    return db_product

@router.delete("/{looper_id}/products/{product_id}")
def delete_looper_product(looper_id: int, product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager"]))):
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.looper_id == looper_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product record not found")
        
    db.delete(db_product)
    db.commit()
    
    log_activity(db, current_user.id, "Delete Product Sales Record", f"Deleted product record ID: {product_id}")
    return {"detail": "Product record deleted successfully"}

@router.get("/{looper_id}/report")
def get_looper_report(looper_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.check_role(["superuser", "manager", "salesman"]))):
    try:
        db_looper = db.query(models.Looper).filter(models.Looper.id == looper_id).first()
        if not db_looper:
            raise HTTPException(status_code=404, detail="Looper not found")

        today = date.today()
        start_of_month = datetime(today.year, today.month, 1)

        # Current month data
        purchases = db.query(models.Purchase).filter(
            models.Purchase.looper_id == looper_id,
            models.Purchase.created_at >= start_of_month
        ).all()
        
        products = db.query(models.Product).filter(
            models.Product.looper_id == looper_id,
            models.Product.created_at >= start_of_month
        ).all()
        
        payments = db.query(models.Payment).filter(
            models.Payment.looper_id == looper_id,
            models.Payment.created_at >= start_of_month
        ).all()

        # Cumulative balance (All time)
        total_charges = (
            (db.query(func.sum(models.Purchase.snapshot_price)).filter(models.Purchase.looper_id == looper_id).scalar() or 0.0) +
            (db.query(func.sum(models.Product.price)).filter(models.Product.looper_id == looper_id).scalar() or 0.0)
        )
        total_paid = db.query(func.sum(models.Payment.amount)).filter(models.Payment.looper_id == looper_id).scalar() or 0.0
        remaining_balance = total_charges - total_paid

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        subtitle_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Custom Styles
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading1'],
            fontName=DEFAULT_FONT,
            fontSize=18,
            spaceAfter=12,
            alignment=1 # Center
        )
        
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading3'],
            fontName=DEFAULT_FONT,
            fontSize=12,
            spaceBefore=10,
            spaceAfter=6,
            textColor=colors.HexColor("#3b82f6")
        )

        item_style = ParagraphStyle(
            'ItemStyle',
            parent=styles['Normal'],
            fontName=DEFAULT_FONT,
            fontSize=10
        )

        # Report Header
        elements.append(Paragraph(f"<b>{settings.PROJECT_NAME} - Client Report</b>", header_style))
        elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", item_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Client Info
        elements.append(Paragraph(f"<b>Client:</b> {format_pdf_text(db_looper.name)}", item_style))
        elements.append(Paragraph(f"<b>Mobile:</b> {format_pdf_text(db_looper.mobile)}", item_style))
        elements.append(Paragraph(f"<b>Month:</b> {today.strftime('%B %Y')}", item_style))
        elements.append(Spacer(1, 0.3 * inch))
        
        elements.append(Paragraph("PURCHASES (Current Month)", section_style))
        if purchases:
            purchase_data = [["Date", "Package Name", "Rate (PKR/Unit)", "Total (PKR)"]]
            for p in purchases:
                unit = "mb"
                if p.package_name and "gb" in p.package_name.lower():
                    unit = "gb"
                
                rate_val = f"{p.unit_price:,.2f}/{unit}" if p.unit_price else "-"
                purchase_data.append([
                    p.created_at.strftime("%Y-%m-%d"), 
                    format_pdf_text(p.package_name), 
                    rate_val,
                    f"{p.snapshot_price:,.0f}"
                ])
        
            t = Table(purchase_data, colWidths=[1.1*inch, 2.0*inch, 1.2*inch, 1.2*inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), DEFAULT_FONT),
                ('FONTNAME', (0, 0), (-1, 0), DEFAULT_FONT),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("No purchases this month.", item_style))
        
        elements.append(Spacer(1, 0.2 * inch))
        
        # Products Table
        elements.append(Paragraph("PRODUCTS (Current Month)", section_style))
        if products:
            product_data = [["Date", "Product", "Price (PKR)"]]
            for p in products:
                product_data.append([p.created_at.strftime("%Y-%m-%d"), format_pdf_text(p.name), f"{p.price:,.0f}"])
            
            t = Table(product_data, colWidths=[1.5*inch, 2.5*inch, 1.5*inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), DEFAULT_FONT),
                ('FONTNAME', (0, 0), (-1, 0), DEFAULT_FONT),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ALIGN', (2, 1), (2, -1), 'RIGHT'),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("No products purchased this month.", item_style))

        elements.append(Spacer(1, 0.2 * inch))

        # Payments Table
        elements.append(Paragraph("PAYMENTS (Current Month)", section_style))
        if payments:
            payment_data = [["Date", "Amount (PKR)"]]
            for p in payments:
                payment_data.append([p.created_at.strftime("%Y-%m-%d"), f"{p.amount:,.0f}"])
            
            t = Table(payment_data, colWidths=[2.5*inch, 2.5*inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), DEFAULT_FONT),
                ('FONTNAME', (0, 0), (-1, 0), DEFAULT_FONT),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
                ('TEXTCOLOR', (1, 1), (1, -1), colors.darkgreen),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("No payments recorded this month.", item_style))

        elements.append(Spacer(1, 0.4 * inch))
        
        # Summary Section
        elements.append(Paragraph("CUMULATIVE SUMMARY", section_style))
        summary_data = [
            ["Total Charges (All Time)", f"{total_charges:,.0f} PKR"],
            ["Total Paid (All Time)", f"{total_paid:,.0f} PKR"],
            ["REMAINING BALANCE", f"{remaining_balance:,.0f} PKR"]
        ]
        t = Table(summary_data, colWidths=[3*inch, 2.5*inch])
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), DEFAULT_FONT),
            ('FONTNAME', (0, 2), (-1, 2), DEFAULT_FONT),
            ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor("#fee2e2") if remaining_balance > 0 else colors.HexColor("#dcfce7")),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.grey),
            ('LINEBELOW', (0, 1), (-1, 1), 1, colors.grey),
            ('TEXTCOLOR', (1, 2), (1, 2), colors.red if remaining_balance > 0 else colors.darkgreen),
            ('SIZE', (0, 2), (-1, 2), 12),
        ]))
        elements.append(t)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Sanitize name for filename (remove non-alphanumeric characters)
        sanitized_name = re.sub(r'[^\w\s-]', '', db_looper.name).strip().replace(' ', '_')
        filename = f"{sanitized_name}_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.pdf"
        
        # Encode filename for Content-Disposition header (RFC 6266)
        filename_encoded = quote(filename)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename*=utf-8''{filename_encoded}"}
        )
    except Exception as e:
        import traceback
        error_msg = f"Error generating report: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return {"error": error_msg}
