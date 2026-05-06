from pydantic import BaseModel
from typing import Optional, Union
from datetime import date


class Cliente(BaseModel):
    id_cliente: str
    nome_cliente: Optional[str] = None
    sobrenome_cliente: Optional[str] = None
    email_cliente: Optional[str] = None
    telefone_cliente: Optional[str] = None
    ramal_cliente: Optional[Union[int, str]] = None
    genero_cliente: Optional[str] = None
    endereco_cliente: Optional[str] = None
    cidade_cliente: Optional[str] = None
    estado_cliente: Optional[str] = None
    pais_cliente: Optional[str] = None
    origem_cliente: Optional[str] = None
    idade: Optional[int] = None

    model_config = {"from_attributes": True}


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

    model_config = {"from_attributes": True}


class DashboardKPIsOut(BaseModel):
    totalRevenue: float
    totalSales: int
    totalCustomers: int
    averageOrderValue: float