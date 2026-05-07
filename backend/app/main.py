from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base
from app.models.cliente import Cliente
from app.models.produto import DimProduto
from app.models.avaliacao import FatoAvaliacoes
from app.models.suporte import FatoSuporte
from app.models.pedido import Pedidos
from app.models.clickstream import FatoClickstream
from app.models.cliente_dispositivo import ClienteDispositivo
from app.routes import clientes, produtos, pedidos, dashboard


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RocketLab API",
    description="Backend for the final project",
    version="1.0.0",
)


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
app.include_router(produtos.router)
app.include_router(pedidos.router)
app.include_router(dashboard.router)
