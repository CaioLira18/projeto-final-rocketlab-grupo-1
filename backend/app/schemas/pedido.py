from pydantic import BaseModel
from typing import Optional
from datetime import date

class PedidoListItem(BaseModel):
    id_pedido: str
    data_pedido: Optional[date]
    id_cliente: Optional[str]
    nome_cliente: Optional[str]
    id_produto: Optional[str]
    nome_produto: Optional[str]
    categoria_produto: Optional[str]
    quantidade_produto: Optional[int]
    valor_pedido: Optional[float]
    metodo_pagamento: Optional[str]
    status_pedido: Optional[str]
    ja_tratada: Optional[bool] = None

    model_config = {"from_attributes": True}

class PedidoCountResponse(BaseModel):
    total: int
    aprovados: int
    recusados: int
    reembolsados: int