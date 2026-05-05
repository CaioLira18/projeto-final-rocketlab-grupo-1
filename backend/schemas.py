from pydantic import BaseModel
from typing import Optional


class Cliente(BaseModel):
    id_cliente: str
    nome_cliente: Optional[str] = None
    sobrenome_cliente: Optional[str] = None
    email_cliente: Optional[str] = None
    telefone_cliente: Optional[str] = None
    ramal_cliente: Optional[str] = None
    genero_cliente: Optional[str] = None
    endereco_cliente: Optional[str] = None
    cidade_cliente: Optional[str] = None
    estado_cliente: Optional[str] = None
    pais_cliente: Optional[str] = None
    origem_cliente: Optional[str] = None
    idade: Optional[int] = None

    model_config = {"from_attributes": True}
