from app.models.suporte import FatoSuporte
from sqlalchemy import Column, String, Float, Boolean, select
from sqlalchemy.orm import column_property
from bd.database import Base
from .cliente import Cliente
from .produto import DimProduto


class FatoAvaliacoes(Base):
    __tablename__ = "fato_avaliacoes"

    id_avaliacao = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_produto = Column(String, index=True, nullable=True)
    id_pedido = Column(String, nullable=True)
    nota_produto = Column(Float, nullable=True)
    comentario_avaliacao = Column(String, nullable=True)
    nota_nps = Column(Float, nullable=True)
    recomenda_produto = Column(Boolean, nullable=True)
    data_avaliacao = Column(String, nullable=True)
    ja_tratada = Column(Boolean, default=False)

    nome_cliente = column_property(
        select(Cliente.nome_cliente)
        .where(Cliente.id_cliente == FatoSuporte.id_cliente)
        .correlate_except(Cliente)
        .scalar_subquery()
    )

    nome_produto = column_property(
        select(DimProduto.nome_produto)
        .where(DimProduto.id_produto == id_produto)
        .correlate_except(DimProduto)
        .scalar_subquery()
    )
