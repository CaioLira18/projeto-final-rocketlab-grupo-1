from sqlalchemy import Column, Integer, String, Float, Date, Boolean, select
from sqlalchemy.orm import column_property
from database import Base
from .cliente_models import Cliente
from .dimProduto_models import DimProduto

class FatoAvaliacoes(Base):
    __tablename__ = "fato_avaliacoes"

    id_avaliacao = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_produto = Column(String, index=True, nullable=True)
    id_pedido = Column(String, nullable=True)
    nota_produto = Column(Float, nullable=True)
    nota_nps = Column(Float, nullable=True)
    recomenda_produto = Column(Boolean, nullable=True)
    data_avaliacao = Column(String, nullable=True)

    # Subqueries to dynamically fetch client/product name
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