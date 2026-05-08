from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from bd.database import get_db
from app.schemas import PedidoListItem
from app.services import list_pedidos

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.get("/", response_model=List[PedidoListItem], summary="Listagem de pedidos")
def listar_pedidos(
    id_pedido: Optional[str] = Query(None, description="Busca por ID do produto"),
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
    limite: int = Query(50, ge=1, le=500, description="Limite de registros"),
    db: Session = Depends(get_db)
):
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
