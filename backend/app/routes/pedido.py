from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, List
from datetime import date

from bd.database import get_db
from app.models import Pedidos
from app.schemas import PedidoListItem, PedidoCountResponse
from app.services import list_pedidos
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/pedidos",
    tags=["Pedidos"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/count", response_model=PedidoCountResponse, summary="Contagem de pedidos por status")
def contar_pedidos(
    nome_cliente: Optional[str] = Query(None),
    nome_produto: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    categoria_produto: Optional[str] = Query(None),
    id_pedido: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Retorna a contagem total de pedidos e a contagem segmentada por status
    (aprovados, recusados, reembolsados), respeitando os mesmos filtros aceitos
    por `GET /pedidos`.

    Usado pelos cards de KPI da tela de pedidos sem precisar paginar a
    listagem inteira.
    """
    query = db.query(
        func.count(Pedidos.id_pedido).label("total"),
        func.sum(case((Pedidos.status_pedido == "Aprovado",    1), else_=0)).label("aprovados"),
        func.sum(case((Pedidos.status_pedido == "Recusado",    1), else_=0)).label("recusados"),
        func.sum(case((Pedidos.status_pedido == "Reembolsado", 1), else_=0)).label("reembolsados"),
    )

    if nome_cliente:
        query = query.filter(Pedidos.nome_cliente.ilike(f"%{nome_cliente}%"))
    if nome_produto:
        query = query.filter(Pedidos.nome_produto.ilike(f"%{nome_produto}%"))
    if status:
        query = query.filter(Pedidos.status_pedido == status)
    if data_inicio:
        query = query.filter(Pedidos.data_pedido >= data_inicio)
    if data_fim:
        query = query.filter(Pedidos.data_pedido <= data_fim)
    if categoria_produto:
        query = query.filter(Pedidos.categoria_produto == categoria_produto)
    if id_pedido:
        query = query.filter(Pedidos.id_pedido.ilike(f"%{id_pedido}%"))

    result = query.one()
    return {
        "total":        result.total        or 0,
        "aprovados":    result.aprovados    or 0,
        "recusados":    result.recusados    or 0,
        "reembolsados": result.reembolsados or 0,
    }


@router.get("/", response_model=List[PedidoListItem], summary="Listagem de pedidos")
def listar_pedidos(
    id_pedido: Optional[str] = Query(None, description="Busca por ID do pedido"),
    id_cliente: Optional[str] = Query(None, description="Filtrar pedidos de um cliente"),
    id_produto: Optional[str] = Query(None, description="Filtrar pedidos de um produto"),
    data_inicio: Optional[date] = Query(None, description="Data inicial do pedido"),
    data_fim: Optional[date] = Query(None, description="Data  final do pedido"),
    valor_min: Optional[float] = Query(None, ge=0, description="Valor mínimo do pedido"),
    valor_max: Optional[float] = Query(None, ge=0, description="Valor máximo do pedido"),
    status: Optional[str] = Query(None, description="Status do pedido"),
    metodo_pagamento: Optional[str] = Query(None, description="Método de pagamento"),
    categoria_produto: Optional[str] = Query(None, description="Categoria do produto"),
    estado: Optional[str] = Query(None, description="Estado do cliente"),
    cidade: Optional[str] = Query(None, description="Cidade do cliente"),
    nome_cliente: Optional[str] = Query(None, description="Busca pelo nome do cliente"),
    nome_produto: Optional[str] = Query(None, description="Busca pelo nome do produto"),
    order_by: str = Query("data_pedido", enum=["data_pedido", "valor_pedido", "quantidade_produto", 
                                               "nome_cliente", "nome_produto", "status_pedido"], 
                                               description="Campo para ordenação"),
    order_dir: str = Query("desc", enum=["asc", "desc"], description="Direção da ordenação"),
    skip: int = Query(0, ge=0, description="Registros para pular"),
    limite: int = Query(50, ge=1, le=9999999, description="Limite de registros"),
    db: Session = Depends(get_db)
):
    """
    Lista pedidos com filtros amplos (cliente, produto, datas, valores, status,
    método de pagamento, localização) e paginação por `skip`/`limite`.

    Cada item já vem enriquecido com nome do cliente, nome do produto e
    categoria, evitando JOINs no frontend. Suporta ordenação configurável
    por `order_by` e `order_dir`.
    """
    return list_pedidos(
        db,
        id_pedido=id_pedido, id_cliente=id_cliente, id_produto=id_produto,
        data_inicio=data_inicio, data_fim=data_fim,
        valor_min=valor_min, valor_max=valor_max,
        status=status, metodo_pagamento=metodo_pagamento, categoria_produto=categoria_produto,
        estado=estado, cidade=cidade,
        nome_cliente=nome_cliente, nome_produto=nome_produto,
        order_by=order_by, order_dir=order_dir,
        skip=skip, limite=limite
    )
