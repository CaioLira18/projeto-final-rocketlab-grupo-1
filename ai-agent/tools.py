import sqlite3

DB_PATH = 'stack_overgol'

def execute_query(query, params=()):
    """Executa query no banco de dados SQLite e retorna resultados como dicts"""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        return {"erro": f"Erro ao executar query: {str(e)}"}


# ==================== ANÁLISES GERAIS ====================

def get_saude_financeira_geral():
    """Retorna métricas principais de saúde financeira da empresa"""
    try:
        query = """
        SELECT
            COUNT(DISTINCT id_cliente) AS total_clientes,
            COUNT(DISTINCT id_pedido) AS total_pedidos,
            ROUND(SUM(valor_pedido), 2) AS receita_total,
            ROUND(AVG(valor_pedido), 2) AS ticket_medio,
            ROUND(SUM(valor_pedido) / COUNT(DISTINCT id_cliente), 2) AS ltv_medio,
            COUNT(CASE WHEN status_pedido = 'Entregue' THEN 1 END) AS pedidos_entregues,
            COUNT(CASE WHEN status_pedido = 'Cancelado' THEN 1 END) AS pedidos_cancelados,
            ROUND(COUNT(CASE WHEN status_pedido = 'Entregue' THEN 1 END) * 100.0 / COUNT(*), 2) AS taxa_entrega_percentual,
            ROUND(COUNT(CASE WHEN status_pedido = 'Cancelado' THEN 1 END) * 100.0 / COUNT(*), 2) AS taxa_cancelamento_percentual
        FROM fato_vendas
        """
        res = execute_query(query)
        if res and isinstance(res, list):
            return res[0] if res else {"erro": "Sem dados disponíveis"}
        return res
    except Exception as e:
        return {"erro": str(e)}


def get_ltv_por_cliente():
    """Calcula LTV (Lifetime Value) para cada cliente"""
    try:
        query = """
        SELECT
            id_cliente,
            nome_cliente,
            COUNT(id_pedido) AS total_pedidos,
            ROUND(SUM(valor_pedido), 2) AS ltv,
            ROUND(AVG(valor_pedido), 2) AS ticket_medio,
            MIN(data_pedido) AS primeira_compra,
            MAX(data_pedido) AS ultima_compra,
            ROUND(
                (julianday('now') - julianday(MIN(data_pedido))) / 365.25, 1
            ) AS anos_como_cliente
        FROM fato_vendas
        GROUP BY id_cliente, nome_cliente
        ORDER BY ltv DESC
        LIMIT 50
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_ticket_medio_por_periodo(tipo_periodo='mes'):
    """Calcula ticket médio por período (dia, mês, trimestre, ano)"""
    try:
        periodos = {
            'dia': "DATE(data_pedido)",
            'mes': "strftime('%Y-%m', data_pedido)",
            'trimestre': "strftime('%Y-Q', data_pedido)",
            'ano': "strftime('%Y', data_pedido)"
        }
        
        if tipo_periodo not in periodos:
            return {"erro": "Tipo de período inválido. Use: dia, mes, trimestre ou ano"}
        
        periodo_expr = periodos[tipo_periodo]
        
        query = f"""
        SELECT
            {periodo_expr} AS periodo,
            COUNT(id_pedido) AS total_pedidos,
            ROUND(AVG(valor_pedido), 2) AS ticket_medio,
            ROUND(SUM(valor_pedido), 2) AS receita_total,
            COUNT(DISTINCT id_cliente) AS clientes_unicos
        FROM fato_vendas
        GROUP BY {periodo_expr}
        ORDER BY periodo DESC
        LIMIT 12
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


# ==================== ANÁLISES DE CLIENTES ====================

def get_clientes_por_localizacao(localizacao, tipo):
    """Busca clientes filtrando por cidade, estado ou país"""
    try:
        colunas = {
            "cidade": "cidade_cliente",
            "estado": "estado_cliente",
            "pais": "pais_cliente"
        }

        if tipo not in colunas:
            return {"erro": "Tipo inválido. Use: cidade, estado ou pais."}

        coluna = colunas[tipo]

        query = f"""
        SELECT
            id_cliente,
            nome_cliente,
            email_cliente,
            telefone_cliente,
            cidade_cliente,
            estado_cliente,
            pais_cliente,
            total_pedidos,
            receita_total_cliente,
            ticket_medio_cliente,
            data_ultima_compra,
            cliente_ativo_90d
        FROM dm_cliente_360
        WHERE LOWER({coluna}) LIKE LOWER(?)
        ORDER BY receita_total_cliente DESC
        LIMIT 100
        """
        res = execute_query(query, (f"%{localizacao}%",))
        return res if res else {"aviso": "Nenhum cliente encontrado nessa localização."}
    except Exception as e:
        return {"erro": str(e)}


def count_clientes_por_localizacao(localizacao, tipo):
    """Conta clientes por localização"""
    try:
        colunas = {
            "cidade": "cidade_cliente",
            "estado": "estado_cliente",
            "pais": "pais_cliente"
        }

        if tipo not in colunas:
            return {"erro": "Tipo inválido."}

        coluna = colunas[tipo]

        query = f"""
        SELECT COUNT(*) AS total_clientes
        FROM dm_cliente_360
        WHERE LOWER({coluna}) LIKE LOWER(?)
        """
        res = execute_query(query, (f"%{localizacao}%",))
        return res[0] if res else {"total_clientes": 0}
    except Exception as e:
        return {"erro": str(e)}


def get_distribuicao_clientes_por_localizacao(tipo):
    """Retorna distribuição de clientes por cidade, estado ou país"""
    try:
        colunas = {
            "cidade": "cidade_cliente",
            "estado": "estado_cliente",
            "pais": "pais_cliente"
        }

        if tipo not in colunas:
            return {"erro": "Tipo inválido. Use: cidade, estado ou pais."}

        coluna = colunas[tipo]

        query = f"""
        SELECT
            {coluna} AS localizacao,
            COUNT(*) AS total_clientes,
            ROUND(SUM(receita_total_cliente), 2) AS receita_total,
            ROUND(AVG(receita_total_cliente), 2) AS receita_media,
            ROUND(SUM(receita_total_cliente) * 100.0 / (SELECT SUM(receita_total_cliente) FROM dm_cliente_360), 2) AS percentual_receita
        FROM dm_cliente_360
        WHERE {coluna} IS NOT NULL
        GROUP BY {coluna}
        ORDER BY receita_total DESC
        LIMIT 20
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_segmentacao_clientes_por_valor():
    """Segmenta clientes por valor (VIP, Premium, Regular, Dormentes)"""
    try:
        query = """
        SELECT
            CASE
                WHEN receita_total_cliente >= 
                    (SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY receita_total_cliente) FROM dm_cliente_360)
                THEN 'VIP'
                WHEN receita_total_cliente >=
                    (SELECT PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY receita_total_cliente) FROM dm_cliente_360)
                THEN 'Premium'
                WHEN receita_total_cliente >=
                    (SELECT PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY receita_total_cliente) FROM dm_cliente_360)
                THEN 'Regular'
                ELSE 'Dormentes'
            END AS segmento,
            COUNT(*) AS total_clientes,
            ROUND(AVG(receita_total_cliente), 2) AS receita_media_segmento,
            ROUND(SUM(receita_total_cliente), 2) AS receita_total_segmento,
            ROUND(AVG(total_pedidos), 2) AS pedidos_medios,
            ROUND(AVG(recencia_dias), 2) AS recencia_media_dias
        FROM dm_cliente_360
        GROUP BY segmento
        ORDER BY receita_total_segmento DESC
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_clientes_com_maior_ltv(limite=10):
    """Retorna os clientes com maior LTV (Lifetime Value)"""
    try:
        query = """
        SELECT
            id_cliente,
            nome_completo_cliente,
            receita_total_cliente AS ltv,
            total_pedidos,
            ticket_medio_cliente,
            nps_medio_cliente,
            taxa_recomendacao_cliente,
            data_primeira_compra,
            data_ultima_compra,
            cliente_ativo_90d
        FROM dm_cliente_360
        ORDER BY receita_total_cliente DESC
        LIMIT ?
        """
        return execute_query(query, (limite,))
    except Exception as e:
        return {"erro": str(e)}


def get_clientes_em_risco_churn():
    """Identifica clientes em risco de churn baseado em recência"""
    try:
        query = """
        SELECT
            id_cliente,
            nome_completo_cliente,
            receita_total_cliente,
            total_pedidos,
            recencia_dias,
            data_ultima_compra,
            CASE
                WHEN recencia_dias > 180 THEN 'Risco Crítico'
                WHEN recencia_dias > 90 THEN 'Risco Alto'
                WHEN recencia_dias > 30 THEN 'Risco Médio'
                ELSE 'Saudável'
            END AS nivel_risco,
            nota_media_atendimento,
            nps_medio_cliente
        FROM dm_cliente_360
        WHERE recencia_dias > 30
        ORDER BY recencia_dias DESC
        LIMIT 50
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_novos_clientes(dias=30):
    """Retorna novos clientes nos últimos N dias"""
    try:
        query = """
        SELECT
            id_cliente,
            nome_completo_cliente,
            email_cliente,
            cidade_cliente,
            estado_cliente,
            data_cadastro_cliente,
            total_pedidos,
            receita_total_cliente,
            ticket_medio_cliente,
            origem_cliente
        FROM dm_cliente_360
        WHERE data_cadastro_cliente >= date('now', '-' || ? || ' days')
        ORDER BY data_cadastro_cliente DESC
        """
        return execute_query(query, (dias,))
    except Exception as e:
        return {"erro": str(e)}


# ==================== ANÁLISES DE VENDAS ====================

def get_receita_por_categoria():
    """Retorna receita total por categoria de produto"""
    try:
        query = """
        SELECT
            fv.categoria_produto,
            COUNT(fv.id_pedido) AS total_pedidos,
            COUNT(DISTINCT fv.id_cliente) AS clientes_unicos,
            ROUND(SUM(fv.valor_pedido), 2) AS receita_total,
            ROUND(AVG(fv.valor_pedido), 2) AS ticket_medio,
            ROUND(COUNT(CASE WHEN fv.status_pedido = 'Entregue' THEN 1 END) * 100.0 / COUNT(*), 2) AS taxa_entrega
        FROM fato_vendas fv
        GROUP BY fv.categoria_produto
        ORDER BY receita_total DESC
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_metodos_pagamento_populares():
    """Retorna métodos de pagamento mais utilizados"""
    try:
        query = """
        SELECT
            metodo_pagamento,
            COUNT(id_pedido) AS total_pedidos,
            ROUND(SUM(valor_pedido), 2) AS receita_total,
            ROUND(AVG(valor_pedido), 2) AS ticket_medio,
            ROUND(COUNT(id_pedido) * 100.0 / (SELECT COUNT(*) FROM fato_vendas), 2) AS percentual_pedidos
        FROM fato_vendas
        WHERE metodo_pagamento IS NOT NULL
        GROUP BY metodo_pagamento
        ORDER BY total_pedidos DESC
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_status_pedidos_distribuicao():
    """Retorna distribuição de status dos pedidos"""
    try:
        query = """
        SELECT
            status_pedido,
            COUNT(id_pedido) AS total_pedidos,
            ROUND(SUM(valor_pedido), 2) AS receita,
            ROUND(COUNT(id_pedido) * 100.0 / (SELECT COUNT(*) FROM fato_vendas), 2) AS percentual
        FROM fato_vendas
        GROUP BY status_pedido
        ORDER BY total_pedidos DESC
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_vendas_por_estado():
    """Retorna vendas (receita e quantidade) por estado"""
    try:
        query = """
        SELECT
            c.estado_cliente,
            COUNT(fv.id_pedido) AS total_pedidos,
            COUNT(DISTINCT fv.id_cliente) AS clientes_unicos,
            ROUND(SUM(fv.valor_pedido), 2) AS receita_total,
            ROUND(AVG(fv.valor_pedido), 2) AS ticket_medio,
            ROUND(SUM(fv.valor_pedido) * 100.0 / (SELECT SUM(valor_pedido) FROM fato_vendas), 2) AS percentual_receita
        FROM fato_vendas fv
        JOIN dim_cliente c ON fv.id_cliente = c.id_cliente
        WHERE c.estado_cliente IS NOT NULL
        GROUP BY c.estado_cliente
        ORDER BY receita_total DESC
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


# ==================== ANÁLISES DE AVALIAÇÕES E SUPORTE ====================

def get_nps_media():
    """Retorna NPS (Net Promoter Score) médio da empresa"""
    try:
        query = """
        SELECT
            ROUND(AVG(nps_medio_cliente), 2) AS nps_medio,
            COUNT(CASE WHEN nps_medio_cliente >= 9 THEN 1 END) AS promotores,
            COUNT(CASE WHEN nps_medio_cliente >= 7 AND nps_medio_cliente < 9 THEN 1 END) AS neutros,
            COUNT(CASE WHEN nps_medio_cliente < 7 THEN 1 END) AS detratores,
            ROUND(COUNT(CASE WHEN nps_medio_cliente >= 9 THEN 1 END) * 100.0 / COUNT(*), 2) AS percentual_promotores,
            ROUND(COUNT(CASE WHEN nps_medio_cliente < 7 THEN 1 END) * 100.0 / COUNT(*), 2) AS percentual_detratores
        FROM dm_cliente_360
        WHERE nps_medio_cliente IS NOT NULL
        """
        res = execute_query(query)
        return res[0] if res else {"erro": "Sem dados de NPS"}
    except Exception as e:
        return {"erro": str(e)}


def get_satisfacao_por_cliente():
    """Retorna satisfação dos clientes por diversas métricas"""
    try:
        query = """
        SELECT
            nome_completo_cliente,
            nota_media_atendimento,
            nota_media_produto,
            nps_medio_cliente,
            taxa_recomendacao_cliente,
            total_avaliacoes,
            total_tickets,
            tempo_medio_resolucao_horas
        FROM dm_cliente_360
        WHERE nps_medio_cliente IS NOT NULL OR nota_media_atendimento IS NOT NULL
        ORDER BY nps_medio_cliente DESC
        LIMIT 30
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


def get_analise_tickets_suporte():
    """Retorna análise de tickets de suporte"""
    try:
        query = """
        SELECT
            COUNT(*) AS total_tickets,
            SUM(tickets_abertos) AS tickets_abertos_total,
            SUM(tickets_fechados) AS tickets_fechados_total,
            ROUND(AVG(tempo_medio_resolucao_horas), 2) AS tempo_medio_resolucao_horas,
            ROUND(AVG(nota_media_atendimento), 2) AS nota_media_atendimento,
            COUNT(CASE WHEN tickets_abertos > 0 THEN 1 END) AS clientes_com_tickets_abertos
        FROM dm_cliente_360
        """
        res = execute_query(query)
        return res[0] if res else {"erro": "Sem dados de suporte"}
    except Exception as e:
        return {"erro": str(e)}


# ==================== ANÁLISES DE ENGAJAMENTO ====================

def get_engajamento_digital():
    """Retorna métricas de engajamento digital dos clientes"""
    try:
        query = """
        SELECT
            ROUND(AVG(total_sessoes), 2) AS sessoes_media,
            ROUND(AVG(total_eventos), 2) AS eventos_media,
            ROUND(AVG(tempo_medio_pagina_seg), 2) AS tempo_medio_pagina_seg,
            COUNT(CASE WHEN total_sessoes > 10 THEN 1 END) AS clientes_alta_engajamento,
            COUNT(CASE WHEN total_sessoes BETWEEN 5 AND 10 THEN 1 END) AS clientes_engajamento_medio,
            COUNT(CASE WHEN total_sessoes < 5 THEN 1 END) AS clientes_baixa_engajamento
        FROM dm_cliente_360
        WHERE total_sessoes IS NOT NULL
        """
        res = execute_query(query)
        return res[0] if res else {"erro": "Sem dados de engajamento"}
    except Exception as e:
        return {"erro": str(e)}


def get_comportamento_compra_por_origem():
    """Retorna comportamento de compra segmentado por origem do cliente"""
    try:
        query = """
        SELECT
            origem_cliente,
            COUNT(*) AS total_clientes,
            ROUND(AVG(receita_total_cliente), 2) AS ltv_medio,
            ROUND(AVG(total_pedidos), 2) AS pedidos_medios,
            ROUND(AVG(ticket_medio_cliente), 2) AS ticket_medio,
            ROUND(SUM(receita_total_cliente), 2) AS receita_total,
            ROUND(AVG(recencia_dias), 2) AS recencia_media_dias,
            COUNT(CASE WHEN cliente_ativo_90d THEN 1 END) AS clientes_ativos
        FROM dm_cliente_360
        WHERE origem_cliente IS NOT NULL
        GROUP BY origem_cliente
        ORDER BY receita_total DESC
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


# ==================== ANÁLISES DE PRODUTOS ====================

def get_produtos_mais_vendidos(limite=20):
    """Retorna produtos mais vendidos"""
    try:
        query = """
        SELECT
            nome_produto,
            categoria_produto,
            COUNT(id_pedido) AS total_vendas,
            SUM(quantidade_produto) AS quantidade_total,
            ROUND(SUM(valor_pedido), 2) AS receita_total,
            ROUND(AVG(valor_pedido), 2) AS preco_medio,
            COUNT(DISTINCT id_cliente) AS clientes_unicos
        FROM fato_vendas
        GROUP BY nome_produto, categoria_produto
        ORDER BY total_vendas DESC
        LIMIT ?
        """
        return execute_query(query, (limite,))
    except Exception as e:
        return {"erro": str(e)}


def get_produtos_menos_vendidos(limite=10):
    """Retorna produtos menos vendidos"""
    try:
        query = """
        SELECT
            nome_produto,
            categoria_produto,
            COUNT(id_pedido) AS total_vendas,
            ROUND(SUM(valor_pedido), 2) AS receita_total
        FROM fato_vendas
        GROUP BY nome_produto, categoria_produto
        ORDER BY total_vendas ASC
        LIMIT ?
        """
        return execute_query(query, (limite,))
    except Exception as e:
        return {"erro": str(e)}


# ==================== ANÁLISES COMPARATIVAS ====================

def comparar_periodos(tipo_periodo='mes'):
    """Compara métricas entre períodos consecutivos"""
    try:
        query = """
        SELECT
            strftime('%Y-%m', data_pedido) AS periodo,
            COUNT(id_pedido) AS total_pedidos,
            COUNT(DISTINCT id_cliente) AS clientes_unicos,
            ROUND(SUM(valor_pedido), 2) AS receita,
            ROUND(AVG(valor_pedido), 2) AS ticket_medio,
            ROUND(SUM(valor_pedido) * 100.0 / (SELECT SUM(valor_pedido) FROM fato_vendas), 2) AS percentual_receita_total
        FROM fato_vendas
        GROUP BY periodo
        ORDER BY periodo DESC
        LIMIT 12
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}


# ==================== DICIONÁRIO DE FERRAMENTAS ====================

available_tools = {
    "get_saude_financeira_geral": get_saude_financeira_geral,
    "get_ltv_por_cliente": get_ltv_por_cliente,
    "get_ticket_medio_por_periodo": get_ticket_medio_por_periodo,
    "get_clientes_por_localizacao": get_clientes_por_localizacao,
    "count_clientes_por_localizacao": count_clientes_por_localizacao,
    "get_distribuicao_clientes_por_localizacao": get_distribuicao_clientes_por_localizacao,
    "get_segmentacao_clientes_por_valor": get_segmentacao_clientes_por_valor,
    "get_clientes_com_maior_ltv": get_clientes_com_maior_ltv,
    "get_clientes_em_risco_churn": get_clientes_em_risco_churn,
    "get_novos_clientes": get_novos_clientes,
    "get_receita_por_categoria": get_receita_por_categoria,
    "get_metodos_pagamento_populares": get_metodos_pagamento_populares,
    "get_status_pedidos_distribuicao": get_status_pedidos_distribuicao,
    "get_vendas_por_estado": get_vendas_por_estado,
    "get_nps_media": get_nps_media,
    "get_satisfacao_por_cliente": get_satisfacao_por_cliente,
    "get_analise_tickets_suporte": get_analise_tickets_suporte,
    "get_engajamento_digital": get_engajamento_digital,
    "get_comportamento_compra_por_origem": get_comportamento_compra_por_origem,
    "get_produtos_mais_vendidos": get_produtos_mais_vendidos,
    "get_produtos_menos_vendidos": get_produtos_menos_vendidos,
    "comparar_periodos": comparar_periodos,
}


tools_definition = [
    {
        "type": "function",
        "function": {
            "name": "get_saude_financeira_geral",
            "description": "Retorna as principais métricas de saúde financeira da empresa: receita total, ticket médio, LTV, taxa de entrega e cancelamento",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ltv_por_cliente",
            "description": "Calcula o Lifetime Value (LTV) para cada cliente, mostrando receita total, ticket médio e anos como cliente",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ticket_medio_por_periodo",
            "description": "Calcula ticket médio por período (dia, mês, trimestre ou ano)",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo_periodo": {
                        "type": "string",
                        "enum": ["dia", "mes", "trimestre", "ano"],
                        "description": "Tipo de período para agrupamento. Padrão: mes"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_clientes_por_localizacao",
            "description": "Busca clientes detalhados filtrando por cidade, estado ou país com informações de receita e atividade",
            "parameters": {
                "type": "object",
                "properties": {
                    "localizacao": {
                        "type": "string",
                        "description": "Nome da cidade, estado ou país"
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["cidade", "estado", "pais"],
                        "description": "Define qual coluna será utilizada no filtro"
                    }
                },
                "required": ["localizacao", "tipo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "count_clientes_por_localizacao",
            "description": "Conta o número total de clientes filtrando por cidade, estado ou país",
            "parameters": {
                "type": "object",
                "properties": {
                    "localizacao": {
                        "type": "string",
                        "description": "Nome da cidade, estado ou país"
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["cidade", "estado", "pais"],
                        "description": "Define qual coluna será utilizada no filtro"
                    }
                },
                "required": ["localizacao", "tipo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_distribuicao_clientes_por_localizacao",
            "description": "Retorna distribuição de clientes por cidade, estado ou país com receita e percentual",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {
                        "type": "string",
                        "enum": ["cidade", "estado", "pais"],
                        "description": "Tipo de localização para agrupar"
                    }
                },
                "required": ["tipo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_segmentacao_clientes_por_valor",
            "description": "Segmenta clientes em 4 categorias: VIP (top 25%), Premium (25-50%), Regular (50-75%) e Dormentes (bottom 25%)",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_clientes_com_maior_ltv",
            "description": "Retorna os clientes com maior Lifetime Value (LTV), mostrando receita e padrão de compras",
            "parameters": {
                "type": "object",
                "properties": {
                    "limite": {
                        "type": "integer",
                        "description": "Número de clientes a retornar. Padrão: 10"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_clientes_em_risco_churn",
            "description": "Identifica clientes em risco de churn baseado em recência de compra (dias desde última compra)",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_novos_clientes",
            "description": "Retorna clientes cadastrados nos últimos N dias com informações de compra inicial",
            "parameters": {
                "type": "object",
                "properties": {
                    "dias": {
                        "type": "integer",
                        "description": "Número de dias para análise. Padrão: 30"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_receita_por_categoria",
            "description": "Retorna receita total, quantidade de pedidos e ticket médio por categoria de produto",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_metodos_pagamento_populares",
            "description": "Retorna métodos de pagamento mais utilizados com receita e percentual de uso",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_status_pedidos_distribuicao",
            "description": "Retorna distribuição de pedidos por status (Entregue, Cancelado, Reembolsado, etc)",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_vendas_por_estado",
            "description": "Retorna análise de vendas (receita, quantidade, ticket médio) por estado",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_nps_media",
            "description": "Retorna NPS (Net Promoter Score) médio com distribuição de promotores, neutros e detratores",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_satisfacao_por_cliente",
            "description": "Retorna satisfação dos clientes por diversas métricas: NPS, avaliação de produto, atendimento",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_analise_tickets_suporte",
            "description": "Retorna análise de tickets de suporte: quantidade aberta/fechada, tempo médio de resolução, satisfação",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_engajamento_digital",
            "description": "Retorna métricas de engajamento digital: sessões médias, eventos, tempo em página, categorização de engajamento",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_comportamento_compra_por_origem",
            "description": "Retorna análise de comportamento de compra segmentado por origem do cliente (Organic, Ads, Referral, etc)",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_produtos_mais_vendidos",
            "description": "Retorna produtos mais vendidos com quantidade de vendas, receita e clientes únicos",
            "parameters": {
                "type": "object",
                "properties": {
                    "limite": {
                        "type": "integer",
                        "description": "Número de produtos a retornar. Padrão: 20"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_produtos_menos_vendidos",
            "description": "Retorna produtos menos vendidos (potencial para descontinuação ou análise)",
            "parameters": {
                "type": "object",
                "properties": {
                    "limite": {
                        "type": "integer",
                        "description": "Número de produtos a retornar. Padrão: 10"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "comparar_periodos",
            "description": "Compara métricas de vendas entre períodos consecutivos (últimos 12 meses)",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo_periodo": {
                        "type": "string",
                        "enum": ["mes", "trimestre"],
                        "description": "Tipo de período para comparação. Padrão: mes"
                    }
                }
            }
        }
    }
]