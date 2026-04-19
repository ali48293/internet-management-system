from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models
from app.core import security
from app.core.config import settings

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if superuser already exists
    admin = db.query(models.User).filter(models.User.username == settings.ADMIN_USERNAME).first()
    if not admin:
        print(f"Creating default superuser: {settings.ADMIN_USERNAME}")
        hashed_pw = security.get_password_hash(settings.ADMIN_PASSWORD)
        admin = models.User(
            username=settings.ADMIN_USERNAME,
            hashed_password=hashed_pw,
            role="superuser",
            is_active=True
        )
        db.add(admin)
        db.commit()
    else:
        print(f"Superuser {settings.ADMIN_USERNAME} already exists.")
    
    db.close()

if __name__ == "__main__":
    init_db()
