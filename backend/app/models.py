from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base

class Looper(Base):
    __tablename__ = "loopers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    mobile = Column(String, index=True, nullable=False)
    cnic_front_url = Column(String, nullable=True)
    cnic_back_url = Column(String, nullable=True)
    profile_pic_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    purchases = relationship("Purchase", back_populates="looper")
    payments = relationship("Payment", back_populates="looper")
    products = relationship("Product", back_populates="looper")

class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False) # e.g. "100MB"
    data_amount_mb = Column(Integer, default=0) # for structured tracking if needed
    price = Column(Float, nullable=False) # e.g. 50000.0 (PKR)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    purchases = relationship("Purchase", back_populates="package")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    looper_id = Column(Integer, ForeignKey("loopers.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=True)
    package_name = Column(String, nullable=True) # "100MB", "1GB"
    snapshot_price = Column(Float, nullable=False) # Price at time of purchase
    unit_price = Column(Float, nullable=True) # Price per unit (MB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    looper = relationship("Looper", back_populates="purchases")
    package = relationship("Package", back_populates="purchases")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    looper_id = Column(Integer, ForeignKey("loopers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    receipt_url = Column(String, nullable=True) # Proof of payment image
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    looper = relationship("Looper", back_populates="payments")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    looper_id = Column(Integer, ForeignKey("loopers.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    looper = relationship("Looper", back_populates="products")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # superuser, manager, salesman, looper
    is_active = Column(Boolean, default=True)
    looper_id = Column(Integer, ForeignKey("loopers.id"), nullable=True) # Linked profile for 'looper' role
    last_active_at = Column(DateTime(timezone=True), nullable=True) # For real-time activity tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    looper = relationship("Looper", backref="user_account")
    activity_logs = relationship("ActivityLog", back_populates="user")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False) # e.g. "Create Looper", "Delete Payment"
    details = Column(String, nullable=True) # JSON or descriptive string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activity_logs")

