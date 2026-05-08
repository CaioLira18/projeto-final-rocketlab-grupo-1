from pydantic import BaseModel
from typing import Optional, Union
from datetime import date
from models import Cliente


class ClienteResponse(BaseModel):
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

ClienteOut = Cliente

class ProdutoMetricas(BaseModel):
    id_produto: str
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    preco_produto: Optional[float] = None
    faixa_preco: Optional[str] = None
    estoque_produto: Optional[int] = None
    produto_ativo: Optional[bool] = None
    fornecedor_produto: Optional[str] = None
    # Métricas de vendas
    total_pedidos: int = 0
    quantidade_vendida: int = 0
    receita_total: float = 0.0
    ticket_medio: Optional[float] = None
    # Métricas de avaliações
    total_avaliacoes: int = 0
    nota_media: Optional[float] = None
    nps_medio: Optional[float] = None
    taxa_recomendacao: Optional[float] = None
    # Métricas de suporte
    total_tickets: int = 0

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

# Define a estrutura de dados de retorno para um único ticket.
class SuporteTicketItem(BaseModel):
    ticket_id: str # Obrigatório
    id_cliente: Optional[str] = None
    nome_cliente: Optional[str] = None
    id_pedido: Optional[str] = None
    id_produto: Optional[str] = None
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    data_pedido: Optional[str] = None
    tipo_problema: Optional[str] = None
    data_abertura: Optional[str] = None
    data_resolucao: Optional[str] = None
    tempo_resolucao_horas: Optional[float] = None # Na gold ta exportando como int, mas faz mais sentido como float para calcular a média de tempo de resolução
    agente_suporte: Optional[str] = None
    status: str = "aberto"
  
    model_config = {"from_attributes": True} 

# Formata a resposta estatística de um produto específico.
class SuporteMetricasProduto(BaseModel):
    id_produto: str # Obrigatório
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    # Padronizar como 0 para não retornar null
    total_tickets: int = 0
    tickets_abertos: int = 0
    tickets_resolvidos: int = 0
    # None pois pode ter 0 ticket
    tempo_resolucao_medio: Optional[float] = None
    taxa_resolucao: Optional[float] = None

    model_config = {"from_attributes": True}