from sqlalchemy.orm import Session
from app.models import Cliente, Pedidos


def list_pedidos(
    db: Session,
    id_pedido=None, id_cliente=None, id_produto=None,
    data_inicio=None, data_fim=None,
    valor_min=None, valor_max=None,
    status=None, metodo_pagamento=None, categoria_produto=None,
    estado=None, cidade=None,
    nome_cliente=None, nome_produto=None,
    busca=None,
    sem_preco=None,
    order_by="data_pedido", order_dir="desc",
    skip=0, limite=50
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
    if sem_preco:
        query = query.filter((Pedidos.valor_pedido == None) | (Pedidos.valor_pedido == 0))
    if status:
        query = query.filter(Pedidos.status_pedido == status)
    if metodo_pagamento:
        query = query.filter(Pedidos.metodo_pagamento == metodo_pagamento)
    if categoria_produto:
        query = query.filter(Pedidos.categoria_produto == categoria_produto)
    if busca:
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Pedidos.nome_cliente.ilike(f"%{busca}%"),
                Pedidos.nome_produto.ilike(f"%{busca}%")
            )
        )
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
