from sqlalchemy import Column, Integer, String, Float, Date
from database import Base


class Cliente(Base):
    __tablename__ = "dim_cliente"

    id_cliente = Column(String, primary_key=True, index=True)
    nome_cliente = Column(String, index=True)
    sobrenome_cliente = Column(String, index=True)
    email_cliente = Column(String, index=True)
    telefone_cliente = Column(String, nullable=True)
    ramal_cliente = Column(Integer, nullable=True)
    genero_cliente = Column(String, nullable=True)
    endereco_cliente = Column(String, nullable=True)
    cidade_cliente = Column(String, nullable=True)
    estado_cliente = Column(String, nullable=True)
    pais_cliente = Column(String, nullable=True)
    origem_cliente = Column(String, nullable=True)
    idade = Column(Integer, nullable=True)

class Pedidos(Base):
    __tablename__ = "fato_vendas"

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