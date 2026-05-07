from sqlalchemy import Column, Float, Integer, String
from database.database import Base

class Pedidos(Base):
    __tablename__ = "fato_vendas"

    id_pedido = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True)
    id_produto = Column(String, index=True)
    valor_pedido = Column(Float, nullable=True)
    data_pedido = Column(String, nullable=True)
    metodo_pagamento = Column(String, nullable=True)
    status_pedido = Column(String, nullable=True)
    quantidade_produto = Column(Integer, nullable=True)
    data_prevista_entrega = Column(String, nullable=True)
