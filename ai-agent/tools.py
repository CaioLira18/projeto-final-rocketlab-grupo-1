import sqlite3

def execute_query(query, params=()):
    with sqlite3.connect('stack_overgol') as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]


def get_clientes_por_localizacao(localizacao, tipo):
    """
    tipo pode ser:
    - cidade
    - estado
    - pais
    """

    colunas = {
        "cidade": "cidade_cliente",
        "estado": "estado_cliente",
        "pais": "pais_cliente"
    }

    if tipo not in colunas:
        return {"erro": "Tipo inválido. Use: cidade, estado ou pais."}

    coluna = colunas[tipo]

    query = f"""
    SELECT *
    FROM dm_cliente
    WHERE LOWER({coluna}) LIKE LOWER(?)
    ORDER BY total_pedidos DESC
    LIMIT 100
    """

    res = execute_query(query, (f"%{localizacao}%",))

    return res if res else {"erro": "Nenhum cliente encontrado nessa localização."}


def count_clientes_por_localizacao(localizacao, tipo):

    colunas = {
        "cidade": "cidade_cliente",
        "estado": "estado_cliente",
        "pais": "pais_cliente"
    }

    if tipo not in colunas:
        return {"erro": "Tipo inválido."}

    coluna = colunas[tipo]

    query = f"""
    SELECT COUNT(DISTINCT id_cliente) AS total_clientes
    FROM dm_cliente
    WHERE LOWER({coluna}) LIKE LOWER(?)
    """

    res = execute_query(query, (f"%{localizacao}%",))

    return res[0] if res else {"total_clientes": 0}


available_tools = {
    "get_clientes_por_localizacao": get_clientes_por_localizacao,
    "count_clientes_por_localizacao": count_clientes_por_localizacao
}


tools_definition = [
    {
        "type": "function",
        "function": {
            "name": "get_clientes_por_localizacao",
            "description": (
                "Busca clientes na tabela dm_cliente filtrando por cidade, estado ou país."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "localizacao": {
                        "type": "string",
                        "description": "Nome da cidade, estado ou país."
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["cidade", "estado", "pais"],
                        "description": "Define qual coluna será utilizada no filtro."
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
            "description": (
                "Conta o número total de clientes distintos na tabela dm_cliente filtrando por cidade, estado ou país."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "localizacao": {
                        "type": "string",
                        "description": "Nome da cidade, estado ou país."
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["cidade", "estado", "pais"],
                        "description": "Define qual coluna será utilizada no filtro."
                    }
                },
                "required": ["localizacao", "tipo"]
            }
        }
    }
]