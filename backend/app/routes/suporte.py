from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from bd.database import get_db
from app.models import DimProduto, FatoSuporte, Pedidos
from app.schemas.suporte import SuporteMetricasProduto, SuporteTicketItem
from app.routes.auth import get_current_user



# Iniciando o router para suporte
router = APIRouter(
    prefix="/suporte",
    tags=["Suporte"],
    dependencies=[Depends(get_current_user)]
)

# Funções privadas para queries diretas ao invés de subqueries complexas, já que o foco é listar tickets e métricas específicas de suporte.
# Coluna de status baseada na data de resolução do ticket, pois não consta na golden schema, mas é essencial para as métricas de suporte.
def _status_col():
    return case(
        (FatoSuporte.data_resolucao == None, "aberto"),
        else_="resolvido",
    ).label("status")

# Consulta principal
def _base_query(db: Session):
    return (
        db.query(
            FatoSuporte.ticket_id,
            FatoSuporte.id_cliente,
            FatoSuporte.nome_cliente,
            FatoSuporte.id_pedido,
            FatoSuporte.data_pedido,
            FatoSuporte.tipo_problema,
            FatoSuporte.data_abertura,
            FatoSuporte.data_resolucao,
            FatoSuporte.tempo_resolucao_horas,
            FatoSuporte.agente_suporte,
            Pedidos.id_produto,
            Pedidos.nome_produto,
            Pedidos.categoria_produto,
            _status_col(),
        )
        .outerjoin(Pedidos, FatoSuporte.id_pedido == Pedidos.id_pedido) # Trará todos os tickets de suporte, mesmo aqueles que não possuem um pedido correspondente na tabela Pedidos
    )

# Função para converter o resultado da query em um schema de resposta, facilitando a manuntenção e legibilidade
def _row_to_ticket(r) -> SuporteTicketItem:
    return SuporteTicketItem(
        ticket_id=r.ticket_id,
        id_cliente=r.id_cliente,
        nome_cliente=r.nome_cliente,
        id_pedido=r.id_pedido,
        id_produto=r.id_produto,
        nome_produto=r.nome_produto,
        categoria_produto=r.categoria_produto,
        data_pedido=r.data_pedido,
        tipo_problema=r.tipo_problema,
        data_abertura=r.data_abertura,
        data_resolucao=r.data_resolucao,
        tempo_resolucao_horas=round(r.tempo_resolucao_horas, 2) if r.tempo_resolucao_horas is not None else None,
        agente_suporte=r.agente_suporte,
        status=r.status,
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
    query = _base_query(db)

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

    return [_row_to_ticket(r) for r in query.offset(skip).limit(limit).all()]

# Endpoint para buscar um ticket específico por ID
@router.get("/tickets/{ticket_id}", response_model=SuporteTicketItem)
def buscar_ticket(ticket_id: str, db: Session = Depends(get_db)):
    resultado = _base_query(db).filter(FatoSuporte.ticket_id == ticket_id).first()

    if not resultado:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    return _row_to_ticket(resultado)

# Endpoint para buscar métricas de suporte de um produto específico por ID, utilizando uma query agregada para calcular as métricas relevantes
@router.get("/metricas/{produto_id}", response_model=SuporteMetricasProduto)
def metricas_suporte_produto(produto_id: str, db: Session = Depends(get_db)):
    produto = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    resultado = (
        db.query(
            func.count(FatoSuporte.ticket_id).label("total_tickets"),
            func.sum(case((FatoSuporte.data_resolucao == None, 1), else_=0)).label("tickets_abertos"),
            func.sum(case((FatoSuporte.data_resolucao != None, 1), else_=0)).label("tickets_resolvidos"),
            func.avg(FatoSuporte.tempo_resolucao_horas).label("tempo_resolucao_medio"),
        )
        .join(Pedidos, FatoSuporte.id_pedido == Pedidos.id_pedido)
        .filter(Pedidos.id_produto == produto_id)
        .first()
    )

    total = resultado.total_tickets or 0
    resolvidos = resultado.tickets_resolvidos or 0
    taxa = round((resolvidos / total) * 100, 2) if total > 0 else None

    return SuporteMetricasProduto(
        id_produto=produto_id,
        nome_produto=produto.nome_produto,
        categoria_produto=produto.categoria_produto,
        total_tickets=total,
        tickets_abertos=resultado.tickets_abertos or 0,
        tickets_resolvidos=resolvidos,
        tempo_resolucao_medio=round(resultado.tempo_resolucao_medio, 2) if resultado.tempo_resolucao_medio else None,
        taxa_resolucao=taxa,
    )