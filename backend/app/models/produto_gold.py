from sqlalchemy import Column, Integer, String, Float, Boolean
from bd.database import BaseGold

class ProdutoGold(BaseGold):
    __tablename__ = "dim_produto"

    id_produto = Column(String, primary_key=True, index=True)
    nome_produto = Column(String, index=True)
    categoria_produto = Column(String, index=True)
    preco_produto = Column(Float)
    fornecedor_produto = Column(String)
    peso_kg_produto = Column(Float)
    estoque_produto = Column(Integer)
    produto_ativo = Column(Boolean)
    data_cadastro_produto = Column(String)
    faixa_preco_produto = Column(String)
    status_estoque_produto = Column(String)
    ja_tratada = Column(Boolean, default=True)
