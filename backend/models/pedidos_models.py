from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

class Pedidos(Base):
    __tablename__ = "pedidos"

    id_pedido = Column(String, primary_key=True, index=True)
    data_pedido = Column(Date)
    id_cliente = Column(String, index=True)
    nome_cliente = Column(String)
    id_produto = Column(String, index=True)
    nome_produto = Column(String)
    categoria_produto = Column(String)
    quantidade_produto = Column(Integer)
    valor_pedido = Column(Float)
    metodo_pagamento = Column(String)
    status_pedido = Column(String)