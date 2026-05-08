import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL_SILVER = os.getenv("DATABASE_URL_SILVER", f"sqlite:///{os.path.join(BASE_DIR, 'app_silver.db')}")
DATABASE_URL_GOLD = os.getenv("DATABASE_URL_GOLD", f"sqlite:///{os.path.join(BASE_DIR, 'app_gold.db')}")

engine_silver = create_engine(
    DATABASE_URL_SILVER, connect_args={"check_same_thread": False}
)
engine_gold = create_engine(
    DATABASE_URL_GOLD, connect_args={"check_same_thread": False}
)

engine = engine_silver

SessionSilver = sessionmaker(autocommit=False, autoflush=False, bind=engine_silver)
SessionGold = sessionmaker(autocommit=False, autoflush=False, bind=engine_gold)

SessionLocal = SessionSilver

Base = declarative_base()
BaseGold = declarative_base()

def get_db():
    db = SessionSilver()
    try:
        yield db
    finally:
        db.close()

def get_db_silver():
    db = SessionSilver()
    try:
        yield db
    finally:
        db.close()

def get_db_gold():
    db = SessionGold()
    try:
        yield db
    finally:
        db.close()

print("SILVER DATABASE:", DATABASE_URL_SILVER)
print("GOLD DATABASE:", DATABASE_URL_GOLD)
