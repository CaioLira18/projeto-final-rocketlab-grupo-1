from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

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