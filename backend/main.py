from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import clientes, pedidos, dashboard

# Create database tables (SQLite)
# In a real-world scenario, Alembic should be used for database migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RocketLab API",
    description="Backend for the final project",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the RocketLab API!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(clientes.router)
app.include_router(pedidos.router)
app.include_router(dashboard.router)
