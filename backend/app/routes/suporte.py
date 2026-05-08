from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from bd.database import get_db
from app.models import DimProduto, FatoSuporte, Pedidos
from app.schemas.suporte import SuporteMetricasProduto, SuporteTicketItem
from app.routes.auth import get_current_user
from app.services.suporte_service import (
    build_suporte_base_query,
    map_row_to_ticket_schema,
    get_metricas_by_produto,
)

# Iniciando o router para suporte
router = APIRouter(
    prefix="/suporte",
    tags=["Suporte"],
    dependencies=[Depends(get_current_user)]
)


# Endpoint para listar tickets de suporte com filtros
@router.get("/tickets", response_model=List[SuporteTicketItem])
def listar_tickets(
    id_produto: Optional[str] = Query(None, description="Filtrar por ID do produto"),
    id_cliente: Optional[str] = Query(None, description="Filtrar por ID do cliente"),
    tipo_problema: Optional[str] = Query(None, description="Filtrar por tipo de problema"),
    agente_suporte: Optional[str] = Query(None, description="Filtrar por agente de suporte"),
    status: Optional[str] = Query(None, description="Status do ticket: aberto ou resolvido"),
    data_inicio: Optional[datetime] = Query(None, description="Data de abertura mínima (YYYY-MM-DD)"),
    data_fim: Optional[datetime] = Query(None, description="Data de abertura máxima (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0, description="Registros para pular (paginação)"),
    limit: int = Query(50, ge=1, le=500, description="Limite de registros por página"),
    db: Session = Depends(get_db),
):
    query = build_suporte_base_query(db)

    if id_produto:
        query = query.filter(Pedidos.id_produto == id_produto)
    if id_cliente:
        query = query.filter(FatoSuporte.id_cliente == id_cliente)
    if tipo_problema:
        query = query.filter(FatoSuporte.tipo_problema.ilike(f"%{tipo_problema}%"))
    if agente_suporte:
        query = query.filter(FatoSuporte.agente_suporte.ilike(f"%{agente_suporte}%"))
    if status == "aberto":
        query = query.filter(FatoSuporte.data_resolucao == None)
    elif status == "resolvido":
        query = query.filter(FatoSuporte.data_resolucao != None)
    if data_inicio:
        query = query.filter(FatoSuporte.data_abertura >= data_inicio)
    if data_fim:
        query = query.filter(FatoSuporte.data_abertura <= data_fim)

    return [map_row_to_ticket_schema(r) for r in query.offset(skip).limit(limit).all()]


# Endpoint para buscar um ticket específico por ID
@router.get("/tickets/{ticket_id}", response_model=SuporteTicketItem)
def buscar_ticket(ticket_id: str, db: Session = Depends(get_db)):
    resultado = build_suporte_base_query(db).filter(FatoSuporte.ticket_id == ticket_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    return map_row_to_ticket_schema(resultado)


# Endpoint para buscar métricas de suporte de um produto específico por ID
@router.get("/metricas/{produto_id}", response_model=SuporteMetricasProduto)
def metricas_suporte_produto(produto_id: str, db: Session = Depends(get_db)):
    produto = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()

    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    return get_metricas_by_produto(db, produto_id)