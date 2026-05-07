from sqlalchemy import Boolean, Column, Float, Integer, String, Date
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
    
# Tabelas
class DimProduto(Base):
    __tablename__ = "dim_produto"

    id_produto = Column(String, primary_key=True, index=True)
    nome_produto = Column(String, index=True)
    categoria_produto = Column(String, index=True)
    preco_produto = Column(Float, nullable=True)
    fornecedor_produto = Column(String, nullable=True)
    estoque_produto = Column(Integer, nullable=True)
    produto_ativo = Column(Boolean, nullable=True)
    faixa_preco = Column(String, nullable=True)

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


class FatoAvaliacoes(Base):
    __tablename__ = "fato_avaliacoes"

    id_avaliacao = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True, nullable=True)
    nome_cliente = Column(String, nullable=True)
    id_produto = Column(String, index=True, nullable=True)
    nome_produto = Column(String, nullable=True)
    id_pedido = Column(String, nullable=True)
    nota_produto = Column(Float, nullable=True)
    nota_nps = Column(Float, nullable=True)
    recomenda_produto = Column(Boolean, nullable=True)
    data_avaliacao = Column(String, nullable=True)


class FatoSuporte(Base):
    __tablename__ = "fato_suporte"

    ticket_id = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True, nullable=True)
    nome_cliente = Column(String, nullable=True)
    id_pedido = Column(String, index=True, nullable=True)
    data_pedido = Column(String, nullable=True)
    tipo_problema = Column(String, nullable=True)
    data_abertura = Column(String, nullable=True)
    data_resolucao = Column(String, nullable=True)
    tempo_resolucao_horas = Column(Float, nullable=True)
    agente_suporte = Column(String, nullable=True)

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