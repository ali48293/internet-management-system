from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LooperBase(BaseModel):
    name: str
    mobile: str
    is_active: bool = True

class LooperCreate(LooperBase):
    pass

class LooperUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    is_active: Optional[bool] = None

class Looper(LooperBase):
    id: int
    cnic_front_url: Optional[str] = None
    cnic_back_url: Optional[str] = None
    profile_pic_url: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    balance: float = 0.0
    package_names: List[str] = []
    
    class Config:
        from_attributes = True

class PackageBase(BaseModel):
    name: str
    data_amount_mb: int
    price: float

class PackageCreate(PackageBase):
    pass

class Package(PackageBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PurchaseCreate(BaseModel):
    package_name: str
    price: float

class Purchase(BaseModel):
    id: int
    looper_id: int
    package_id: Optional[int] = None
    package_name: Optional[str] = None
    snapshot_price: float
    unit_price: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount: float

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    looper_id: int
    receipt_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardData(BaseModel):
    total_loopers: int
    active_loopers: int
    inactive_loopers: int
    total_revenue: float
    total_remaining_balance: float
    active_users_count: int

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    looper_id: int
    receipt_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    role: str
    is_active: bool = True
    looper_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    looper_id: Optional[int] = None

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ActivityLog(BaseModel):
    id: int
    user_id: int
    action: str
    details: Optional[str] = None
    created_at: datetime
    username: Optional[str] = None # For frontend convenience

    class Config:
        from_attributes = True

