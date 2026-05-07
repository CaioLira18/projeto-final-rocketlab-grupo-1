from sqlalchemy import Column, Float, String
from database.database import Base

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
