from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from database.database import get_db
from app.schemas.cliente import ClienteResponse
from app.services.cliente_service import ClienteService

router = APIRouter(prefix="/clientes", tags=["Clientes"])


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
    return ClienteService.listar_clientes(
        db=db,
        nome=nome,
        sobrenome=sobrenome,
        email=email,
        cidade=cidade,
        estado=estado,
        pais=pais,
        genero=genero,
        origem=origem,
        idade_min=idade_min,
        idade_max=idade_max,
        busca=busca,
        skip=skip,
        limit=limit,
    )


@router.get("/{cliente_id}", response_model=ClienteResponse)
def buscar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    cliente = ClienteService.buscar_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente
