from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CaseDB(Base):
    __tablename__ = "cases"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    case_number = Column(String, nullable=False)
    petitioner  = Column(String, nullable=False)
    respondent  = Column(String, nullable=False)
    court_name  = Column(String, default="N/A")
    status      = Column(String, default="active")
    created_at  = Column(DateTime, default=datetime.utcnow)


class HearingDB(Base):
    __tablename__ = "hearings"

    id      = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    title   = Column(String, nullable=False)
    date    = Column(String, nullable=False)
    time    = Column(String, nullable=False)
    court   = Column(String, nullable=False)
    details = Column(String, default="")


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
