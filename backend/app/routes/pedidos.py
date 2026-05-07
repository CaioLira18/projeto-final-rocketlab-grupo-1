from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from database.database import get_db
from app.models.cliente import Cliente
from app.models.pedido import Pedidos
from app.schemas.pedido import PedidoListItem

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
    needs_cliente_join = any([estado, cidade])

    query = db.query(Pedidos)

    if needs_cliente_join:
        query = query.join(Cliente, Pedidos.id_cliente == Cliente.id_cliente, isouter=True)

    if id_pedido:
        query = query.filter(Pedidos.id_pedido == id_pedido)
    if id_cliente:
        query = query.filter(Pedidos.id_cliente == id_cliente)
    if id_produto:
        query = query.filter(Pedidos.id_produto == id_produto)
    if data_inicio:
        query = query.filter(Pedidos.data_pedido >= data_inicio)
    if data_fim:
        query = query.filter(Pedidos.data_pedido <= data_fim)
    if valor_min is not None:
        query = query.filter(Pedidos.valor_pedido >= valor_min)
    if valor_max is not None:
        query = query.filter(Pedidos.valor_pedido <= valor_max)
    if status:
        query = query.filter(Pedidos.status_pedido == status)
    if metodo_pagamento:
        query = query.filter(Pedidos.metodo_pagamento == metodo_pagamento)
    if categoria_produto:
        query = query.filter(Pedidos.categoria_produto == categoria_produto)
    if nome_cliente:
        query = query.filter(Pedidos.nome_cliente.ilike(f"%{nome_cliente}%"))
    if nome_produto:
        query = query.filter(Pedidos.nome_produto.ilike(f"%{nome_produto}%"))
    if estado:
        query = query.filter(Cliente.estado_cliente == estado)
    if cidade:
        query = query.filter(Cliente.cidade_cliente.ilike(f"%{cidade}%"))

    order_column_map = {
        "data_pedido": Pedidos.data_pedido,
        "valor_pedido": Pedidos.valor_pedido,
        "quantidade_produto": Pedidos.quantidade_produto,
        "nome_cliente": Pedidos.nome_cliente,
        "nome_produto": Pedidos.nome_produto,
        "status_pedido": Pedidos.status_pedido,
    }

    col = order_column_map.get(order_by, Pedidos.data_pedido)
    query = query.order_by(col.desc() if order_dir == "desc" else col.asc())

    return query.offset(skip).limit(limite).all()