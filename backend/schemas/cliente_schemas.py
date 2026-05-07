from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

from .pedidos_schemas import PedidoListItem


class ClienteResponse(BaseModel):
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


ClienteOut = ClienteResponse


class TicketListItem(BaseModel):
    ticket_id: str
    id_cliente: Optional[str] = None
    nome_cliente: Optional[str] = None
    id_pedido: Optional[str] = None
    data_pedido: Optional[str] = None
    tipo_problema: Optional[str] = None
    data_abertura: Optional[str] = None
    data_resolucao: Optional[str] = None
    tempo_resolucao_horas: Optional[float] = None
    agente_suporte: Optional[str] = None

    model_config = {"from_attributes": True}


class ClienteHistoricoResponse(BaseModel):
    cliente: ClienteResponse
    total_pedidos: int = 0
    valor_total: float = 0.0
    total_tickets: int = 0
    tickets_abertos: int = 0
    pedidos: List[PedidoListItem] = Field(default_factory=list)
    tickets: List[TicketListItem] = Field(default_factory=list)

    model_config = {"from_attributes": True}
