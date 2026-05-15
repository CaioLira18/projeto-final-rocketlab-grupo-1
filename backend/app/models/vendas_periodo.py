from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from bd.database import BaseGold

class VendasPeriodo(BaseGold):
    __tablename__ = "dm_vendas_periodo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    data_pedido = Column(Date, index=True)
    ano_pedido = Column(Integer)
    mes_pedido = Column(Integer)
    mes_referencia = Column(String)
    estado_cliente = Column(String, index=True)
    cidade_cliente = Column(String)
    categoria_produto = Column(String, index=True)
    status_pedido = Column(String, index=True)
    metodo_pagamento = Column(String)
    total_pedidos = Column(Integer)
    total_clientes = Column(Integer)
    total_produtos = Column(Integer)
    total_itens = Column(Integer)
    receita_total = Column(Float)
    ticket_medio = Column(Float)
    receita_aprovados = Column(Float)
    receita_recusados = Column(Float)
    receita_processando = Column(Float)
    receita_reembolsado = Column(Float)
    ja_tratada = Column(Boolean, default=True)
