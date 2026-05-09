from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import cliente_router, produto_router, pedido_router, dashboard_router, auth_router, suporte_router, export_router

app = FastAPI(
    title="RocketLab API",
    description="Backend for the final project",
    version="1.0.0",
    swagger_ui_parameters={"tryItOutEnabled": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra o router de autenticação (público) primeiro
app.include_router(auth_router)

# Registra os routers de dados protegidos
app.include_router(cliente_router)
app.include_router(produto_router)
app.include_router(pedido_router)
app.include_router(dashboard_router)
app.include_router(suporte_router)
app.include_router(export_router)



@app.get("/")
def read_root():
    return {"message": "Welcome to the RocketLab API!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
