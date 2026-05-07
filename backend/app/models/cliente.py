from typing import Optional
from sqlalchemy import Column, String, Integer
from database.database import Base

class Cliente(Base):
    __tablename__ = "dim_cliente"

    id_cliente = Column(String, primary_key=True, index=True)
    nome_cliente = Column(String, index=True)
    sobrenome_cliente = Column(String, index=True)
    email_cliente = Column(String, index=True)
    telefone_cliente = Column(String, nullable=True)
    ramal_cliente = Column(Integer, nullable=True)
    genero_cliente = Column(String, nullable=True)
    data_nascimento_cliente = Column(String, nullable=True)
    data_cadastro_cliente = Column(String, nullable=True)
    endereco_cliente = Column(String, nullable=True)
    cidade_cliente = Column(String, nullable=True)
    estado_cliente = Column(String, nullable=True)
    pais_cliente = Column(String, nullable=True)
    origem_cliente = Column(String, nullable=True)

    @property
    def idade(self) -> Optional[int]:
        if not self.data_nascimento_cliente:
            return None
        from datetime import date
        try:
            birth_date = date.fromisoformat(self.data_nascimento_cliente)
            today = date.today()
            return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        except ValueError:
            return None
