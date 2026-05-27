from sqlalchemy import Column, Integer, String, Float, Date, select
from sqlalchemy.orm import column_property
from bd.database import Base
from .cliente import Cliente
from .produto import DimProduto


class Pedidos(Base):
    __tablename__ = "fato_vendas"

    id_pedido = Column(String, primary_key=True, index=True)
    data_pedido = Column(Date)
    id_cliente = Column(String, index=True)
    id_produto = Column(String, index=True)
    quantidade_produto = Column(Integer)
    valor_pedido = Column(Float)
    metodo_pagamento = Column(String)
    status_pedido = Column(String)

    nome_cliente = column_property(
        select(Cliente.nome_cliente)
        .where(Cliente.id_cliente == id_cliente)
        .correlate_except(Cliente)
        .scalar_subquery()
    )
    nome_produto = column_property(
        select(DimProduto.nome_produto)
        .where(DimProduto.id_produto == id_produto)
        .correlate_except(DimProduto)
        .scalar_subquery()
    )
    categoria_produto = column_property(
        select(DimProduto.categoria_produto)
        .where(DimProduto.id_produto == id_produto)
        .correlate_except(DimProduto)
        .scalar_subquery()
    )
