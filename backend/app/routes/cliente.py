from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from bd.database import get_db
from app.schemas import ClienteResponse, ClienteHistoricoResponse
from app.services import list_clientes, get_cliente_by_id, get_cliente_historico
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(
    nome: Optional[str] = Query(None, description="Filtrar por nome"),
    sobrenome: Optional[str] = Query(None, description="Filtrar por sobrenome"),
    email: Optional[str] = Query(None, description="Filtrar por email"),
    cidade: Optional[str] = Query(None, description="Filtrar por cidade"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    pais: Optional[str] = Query(None, description="Filtrar por país"),
    genero: Optional[str] = Query(None, description="Filtrar por gênero (M/F)"),
    origem: Optional[str] = Query(None, description="Filtrar por origem (Web/App/Indicação)"),
    idade_min: Optional[int] = Query(None, description="Idade mínima"),
    idade_max: Optional[int] = Query(None, description="Idade máxima"),
    busca: Optional[str] = Query(None, description="Busca geral: nome, sobrenome ou email"),
    skip: int = Query(0, ge=0, description="Registros para pular (paginação)"),
    limit: int = Query(50, ge=1, le=500, description="Limite de registros (paginação)"),
    db: Session = Depends(get_db),
):
    return list_clientes(
        db,
        nome=nome, sobrenome=sobrenome, email=email, cidade=cidade, estado=estado, pais=pais,
        genero=genero, origem=origem, idade_min=idade_min, idade_max=idade_max, busca=busca,
        skip=skip, limit=limit
    )


@router.get("/{cliente_id}", response_model=ClienteResponse)
def buscar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    return get_cliente_by_id(db, cliente_id)


@router.get("/{cliente_id}/historico", response_model=ClienteHistoricoResponse)
def buscar_historico_cliente(cliente_id: str, db: Session = Depends(get_db)):
    return get_cliente_historico(db, cliente_id)
