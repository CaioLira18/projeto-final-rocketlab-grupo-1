from sqlalchemy import Column, String, Float, Boolean, select, DateTime
from sqlalchemy.orm import column_property
from bd.database import Base
from .cliente import Cliente
from .pedido import Pedidos


class FatoSuporte(Base):
    __tablename__ = "fato_suporte"

    ticket_id = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_pedido = Column(String, index=True, nullable=True)
    tipo_problema = Column(String, nullable=True)
    data_abertura = Column(DateTime, nullable=True)
    data_resolucao = Column(DateTime, nullable=True)
    tempo_resolucao_horas = Column(Float, nullable=True)
    agente_suporte = Column(String, nullable=True)
    nota_avaliacao_problema = Column(Float, nullable=True)
    sentimento = Column(String, nullable=True)
    status_ticket = Column(String, nullable=True)
    ja_tratada = Column(Boolean, default=False)

    nome_cliente = column_property(
        select(Cliente.nome_cliente)
        .where(Cliente.id_cliente == id_cliente)
        .correlate_except(Cliente)
        .scalar_subquery()
    )
    data_pedido = column_property(
        select(Pedidos.data_pedido)
        .where(Pedidos.id_pedido == id_pedido)
        .correlate_except(Pedidos)
        .scalar_subquery()
    )
