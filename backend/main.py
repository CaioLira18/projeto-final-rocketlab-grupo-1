from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import cliente_router, produto_router, pedido_router, dashboard_router, auth_router, suporte_router, export_router, chat_router

app = FastAPI(
    title="RocketLab API",
    description="Backend for the final project",
    version="1.0.0",
    swagger_ui_parameters={"tryItOutEnabled": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Adicionar "*" para teste local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],  # ← adicionar isso
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
app.include_router(chat_router)



@app.get("/", tags=["Sistema"], summary="Boas-vindas da API")
def read_root():
    """Endpoint público que retorna uma mensagem de boas-vindas. Útil para
    verificar rapidamente se a API está respondendo na raiz."""
    return {"message": "Welcome to the RocketLab API!"}


@app.get("/health", tags=["Sistema"], summary="Health check da API")
def health_check():
    """Health check usado para liveness/readiness probes. Retorna sempre
    `{"status": "ok"}` quando o processo está respondendo."""
    return {"status": "ok"}
