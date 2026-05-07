from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

class FatoVendas(Base):
    __tablename__ = "fato_vendas"

    id_pedido = Column(String, primary_key=True, index=True)
    data_pedido = Column(String, nullable=True)
    id_cliente = Column(String, index=True, nullable=True)
    nome_cliente = Column(String, nullable=True)
    id_produto = Column(String, index=True, nullable=True)
    nome_produto = Column(String, nullable=True)
    categoria_produto = Column(String, nullable=True)
    quantidade_produto = Column(Integer, nullable=True)
    valor_pedido = Column(Float, nullable=True)
    metodo_pagamento = Column(String, nullable=True)
    status_pedido = Column(String, nullable=True)