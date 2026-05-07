from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from app.models.pedido import Pedidos
from app.models.cliente import Cliente

class PedidoService:
    @staticmethod
    def listar_pedidos(
        db: Session,
        id_pedido: Optional[str] = None,
        id_cliente: Optional[str] = None,
        id_produto: Optional[str] = None,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        valor_min: Optional[float] = None,
        valor_max: Optional[float] = None,
        status: Optional[str] = None,
        metodo_pagamento: Optional[str] = None,
        categoria_produto: Optional[str] = None,
        estado: Optional[str] = None,
        cidade: Optional[str] = None,
        nome_cliente: Optional[str] = None,
        nome_produto: Optional[str] = None,
        order_by: str = "data_pedido",
        order_dir: str = "desc",
        skip: int = 0,
        limite: int = 50,
    ) -> List[Pedidos]:
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
