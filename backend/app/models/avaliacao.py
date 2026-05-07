from sqlalchemy import Boolean, Column, Float, String, Text
from database.database import Base

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
