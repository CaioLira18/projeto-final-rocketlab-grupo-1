from sqlalchemy import Boolean, Column, Float, Integer, String, Text
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
    data_nascimento_cliente = Column(String, nullable=True)
    data_cadastro_cliente = Column(String, nullable=True)
    endereco_cliente = Column(String, nullable=True)
    cidade_cliente = Column(String, nullable=True)
    estado_cliente = Column(String, nullable=True)
    pais_cliente = Column(String, nullable=True)
    origem_cliente = Column(String, nullable=True)


class DimProduto(Base):
    __tablename__ = "dim_produto"

    id_produto = Column(String, primary_key=True, index=True)
    nome_produto = Column(String, index=True)
    categoria_produto = Column(String, index=True)
    preco_produto = Column(Float, nullable=True)
    fornecedor_produto = Column(String, nullable=True)
    peso_kg_produto = Column(Float, nullable=True)
    estoque_produto = Column(Integer, nullable=True)
    produto_ativo = Column(Boolean, nullable=True)
    data_cadastro_produto = Column(String, nullable=True)


class FatoAvaliacoes(Base):
    __tablename__ = "fato_avaliacoes"

    id_avaliacao = Column(String, primary_key=True, index=True)
    id_pedido = Column(String, index=True, nullable=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_produto = Column(String, index=True, nullable=True)
    nota_produto = Column(Float, nullable=True)
    comentario_avaliacao = Column(Text, nullable=True)
    nota_nps = Column(Float, nullable=True)
    recomenda_produto = Column(Boolean, nullable=True)
    data_avaliacao = Column(String, nullable=True)


class FatoSuporte(Base):
    __tablename__ = "fato_suporte"

    ticket_id = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_pedido = Column(String, index=True, nullable=True)
    tipo_problema = Column(String, nullable=True)
    data_abertura = Column(String, nullable=True)
    data_resolucao = Column(String, nullable=True)
    tempo_resolucao_horas = Column(Float, nullable=True)
    agente_suporte = Column(String, nullable=True)
    nota_avaliacao_problema = Column(Float, nullable=True)
    sentimento = Column(String, nullable=True)
    status_ticket = Column(String, nullable=True)


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


class FatoClickstream(Base):
    __tablename__ = "fato_clickstream"

    id_evento = Column(String, primary_key=True, index=True)
    id_sessao = Column(String, index=True, nullable=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_dispositivo = Column(String, index=True, nullable=True)
    id_produto = Column(String, index=True, nullable=True)
    tipo_evento = Column(String, nullable=True)
    canal_evento = Column(String, nullable=True)
    dispositivo_evento = Column(String, nullable=True)
    origem_sessao = Column(String, nullable=True)
    data_evento = Column(String, nullable=True)
    tempo_pagina_seg = Column(Float, nullable=True)


class ClienteDispositivo(Base):
    __tablename__ = "dim_cliente_dispositivo"

    # Criando uma PK artificial para evitar erro se id_cliente + id_dispositivo não for sempre único ou caso precisem de PK simples
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_dispositivo = Column(String, index=True, nullable=True)