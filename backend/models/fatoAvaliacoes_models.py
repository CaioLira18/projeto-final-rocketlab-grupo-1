from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from database import Base

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