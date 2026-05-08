from sqlalchemy import Column, Integer, String
from bd.database import BaseGold

class ClienteGold(BaseGold):
    __tablename__ = "dim_cliente"

    id_cliente = Column(String, primary_key=True, index=True)
    nome_cliente = Column(String)
    sobrenome_cliente = Column(String)
    nome_completo_cliente = Column(String, index=True)
    email_cliente = Column(String)
    telefone_cliente = Column(String)
    ramal_cliente = Column(String, nullable=True)
    genero_cliente = Column(String)
    data_nascimento_cliente = Column(String)
    data_cadastro_cliente = Column(String)
    endereco_cliente = Column(String)
    cidade_cliente = Column(String)
    estado_cliente = Column(String)
    pais_cliente = Column(String)
    origem_cliente = Column(String)
    idade_cliente = Column(Integer)
