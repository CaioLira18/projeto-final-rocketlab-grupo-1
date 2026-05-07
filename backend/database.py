import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables (if any)
load_dotenv()

# We will use a local SQLite database for this project.
# The database file will be created in the backend directory.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Create the SQLAlchemy engine
# connect_args={"check_same_thread": False} is needed for SQLite
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

print("DATABASE:", DATABASE_URL)
print("PWD:", os.getcwd())
