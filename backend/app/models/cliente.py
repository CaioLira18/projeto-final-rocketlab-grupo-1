from sqlalchemy import Column, Integer, String, Boolean, func
from sqlalchemy.orm import column_property
from bd.database import Base


class Cliente(Base):
    __tablename__ = "dim_cliente"

    id_cliente = Column(String, primary_key=True)
    nome_cliente = Column(String, index=True)
    sobrenome_cliente = Column(String, index=True)
    email_cliente = Column(String, index=True)
    telefone_cliente = Column(String, nullable=True)
    ramal_cliente = Column(String, nullable=True)
    genero_cliente = Column(String, nullable=True)
    endereco_cliente = Column(String, nullable=True)
    cidade_cliente = Column(String, nullable=True)
    estado_cliente = Column(String, nullable=True)
    pais_cliente = Column(String, nullable=True)
    origem_cliente = Column(String, nullable=True)
    data_nascimento_cliente = Column(String, nullable=True)
    data_cadastro_cliente = Column(String, nullable=True)
    ja_tratada = Column(Boolean, default=False)

    idade = column_property(
        func.cast(
            func.strftime('%Y', 'now') - func.strftime('%Y', data_nascimento_cliente),
            Integer
        )
    )
