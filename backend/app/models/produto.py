from sqlalchemy import Column, Integer, String, Float, Boolean
from bd.database import Base


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
    faixa_preco = Column(String, nullable=True)
    ja_tratada = Column(Boolean, default=False)
