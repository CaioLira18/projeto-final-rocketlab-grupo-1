# app/schemas/cliente360.py
from pydantic import BaseModel
from typing import Optional


class Cliente360Response(BaseModel):
    id_cliente: str
    nome_cliente: Optional[str] = None
    sobrenome_cliente: Optional[str] = None
    nome_completo_cliente: Optional[str] = None
    email_cliente: Optional[str] = None
    telefone_cliente: Optional[str] = None
    genero_cliente: Optional[str] = None
    cidade_cliente: Optional[str] = None
    estado_cliente: Optional[str] = None
    pais_cliente: Optional[str] = None
    origem_cliente: Optional[str] = None
    data_cadastro_cliente: Optional[str] = None
    idade_cliente: Optional[int] = None
    # compras
    total_pedidos: Optional[int] = 0
    receita_total_cliente: Optional[float] = 0.0
    ticket_medio_cliente: Optional[float] = 0.0
    total_itens_comprados: Optional[int] = 0
    data_primeira_compra: Optional[str] = None
    data_ultima_compra: Optional[str] = None
    recencia_dias: Optional[int] = None
    pedidos_aprovados: Optional[int] = 0
    pedidos_recusados: Optional[int] = 0
    pedidos_processando: Optional[int] = 0
    pedidos_reembolsados: Optional[int] = 0
    # suporte
    total_tickets: Optional[int] = 0
    tickets_abertos: Optional[int] = 0
    tickets_fechados: Optional[int] = 0
    tempo_medio_resolucao_horas: Optional[float] = None
    nota_media_atendimento: Optional[float] = None
    data_ultimo_ticket: Optional[str] = None
    # avaliações
    total_avaliacoes: Optional[int] = 0
    nota_media_produto: Optional[float] = None
    nps_medio_cliente: Optional[float] = None
    taxa_recomendacao_cliente: Optional[float] = None
    data_ultima_avaliacao: Optional[str] = None
    # engajamento
    total_sessoes: Optional[int] = 0
    total_eventos: Optional[int] = 0
    tempo_medio_pagina_seg: Optional[float] = None
    data_ultimo_evento: Optional[str] = None
    eventos_compra: Optional[int] = 0
    eventos_add_carrinho: Optional[int] = 0
    eventos_pageview: Optional[int] = 0
    # segmento
    faixa_valor_cliente: Optional[str] = None
    cliente_ativo_90d: Optional[bool] = None

    model_config = {"from_attributes": True}
