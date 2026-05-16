from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, case
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

router = APIRouter(
    prefix="/suporte",
    tags=["Suporte"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/resumo")
def resumo_suporte(
    id_cliente: Optional[str] = Query(None),
    tipo_problema: Optional[str] = Query(None),
    agente_suporte: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    data_inicio: Optional[datetime] = Query(None),
    data_fim: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(FatoSuporte)

    if id_cliente:
        q = q.filter(FatoSuporte.id_cliente == id_cliente)
    if tipo_problema:
        q = q.filter(FatoSuporte.tipo_problema.ilike(f"%{tipo_problema}%"))
    if agente_suporte:
        q = q.filter(FatoSuporte.agente_suporte.ilike(f"%{agente_suporte}%"))
    if status == "aberto":
        q = q.filter(FatoSuporte.data_resolucao == None)
    elif status == "resolvido":
        q = q.filter(FatoSuporte.data_resolucao != None)
    if data_inicio:
        q = q.filter(FatoSuporte.data_abertura >= data_inicio)
    if data_fim:
        q = q.filter(FatoSuporte.data_abertura <= data_fim)

    r = q.with_entities(
        func.count(FatoSuporte.ticket_id).label("total"),
        func.sum(case((FatoSuporte.data_resolucao == None, 1), else_=0)).label("abertos"),
        func.sum(case((FatoSuporte.data_resolucao != None, 1), else_=0)).label("resolvidos"),
        func.avg(FatoSuporte.tempo_resolucao_horas).label("tempo_medio"),
    ).first()

    return {
        "total": r.total or 0,
        "abertos": r.abertos or 0,
        "resolvidos": r.resolvidos or 0,
        "tempo_medio": round(r.tempo_medio, 1) if r.tempo_medio else None,
    }
    
@router.get("/tickets", response_model=List[SuporteTicketItem])
def listar_tickets(
    response: Response,
    id_produto: Optional[str] = Query(None, description="Filtrar por ID do produto"),
    id_cliente: Optional[str] = Query(None, description="Filtrar por ID do cliente"),
    tipo_problema: Optional[str] = Query(None, description="Filtrar por tipo de problema"),
    nome_cliente: Optional[str] = Query(None, description="Filtrar por nome do cliente"),
    agente_suporte: Optional[str] = Query(None, description="Filtrar por agente de suporte"),
    status: Optional[str] = Query(None, description="Status do ticket: aberto ou resolvido"),
    data_inicio: Optional[datetime] = Query(None, description="Data de abertura mínima (YYYY-MM-DD)"),
    data_fim: Optional[datetime] = Query(None, description="Data de abertura máxima (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0, description="Registros para pular (paginação)"),
    limit: int = Query(50, ge=1, le=500, description="Limite de registros por página"),
    db: Session = Depends(get_db),
):
    # query de dados
    query = build_suporte_base_query(db)
    # query de contagem independente com os mesmos joins
    count_query = build_suporte_base_query(db)

    def aplicar_filtros(q):
        if id_produto:
            q = q.filter(Pedidos.id_produto == id_produto)
        if id_cliente:
            q = q.filter(FatoSuporte.id_cliente == id_cliente)
        if tipo_problema:
            q = q.filter(FatoSuporte.tipo_problema.ilike(f"%{tipo_problema}%"))
        if nome_cliente:
            q = q.filter(FatoSuporte.nome_cliente == nome_cliente)
        if agente_suporte:
            q = q.filter(FatoSuporte.agente_suporte.ilike(f"%{agente_suporte}%"))
        if status == "aberto":
            q = q.filter(FatoSuporte.data_resolucao == None)
        elif status == "resolvido":
            q = q.filter(FatoSuporte.data_resolucao != None)
        if data_inicio:
            q = q.filter(FatoSuporte.data_abertura >= data_inicio)
        if data_fim:
            q = q.filter(FatoSuporte.data_abertura <= data_fim)
        return q

    query = aplicar_filtros(query)
    count_query = aplicar_filtros(count_query)

    total = count_query.with_entities(func.count(FatoSuporte.ticket_id)).scalar()
    response.headers["X-Total-Count"] = str(total)

    return [map_row_to_ticket_schema(r) for r in query.offset(skip).limit(limit).all()]

@router.get("/tickets/{ticket_id}", response_model=SuporteTicketItem)
def buscar_ticket(ticket_id: str, db: Session = Depends(get_db)):
    resultado = build_suporte_base_query(db).filter(FatoSuporte.ticket_id == ticket_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    return map_row_to_ticket_schema(resultado)


@router.get("/metricas/{produto_id}", response_model=SuporteMetricasProduto)
def metricas_suporte_produto(produto_id: str, db: Session = Depends(get_db)):
    produto = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()

    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    return get_metricas_by_produto(db, produto_id)
