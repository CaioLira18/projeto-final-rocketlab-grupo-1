from sqlalchemy import Column, Float, String
from database.database import Base

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
