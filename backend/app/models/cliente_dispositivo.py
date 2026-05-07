from sqlalchemy import Column, Integer, String
from database.database import Base

class ClienteDispositivo(Base):
    __tablename__ = "dim_cliente_dispositivo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(String, index=True, nullable=True)
    id_dispositivo = Column(String, index=True, nullable=True)
