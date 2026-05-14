import os
import re
import sqlite3
from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field, TypeAdapter
from pydantic_ai import Agent, ModelMessage, RunContext
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

load_dotenv()

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_GOLD_PATH = os.path.join(_BASE_DIR, '..', '..', 'bd', 'app_gold.db')

ALLOWED_TABLES = {
    "dim_cliente",
    "dim_produto",
    "dm_cliente_360",
    "dm_produto_360",
    "dm_vendas_periodo",
}

GOLD_DB_PATH: str = os.getenv(
    'DATABASE_URL_GOLD',
    f"sqlite:///{os.path.normpath(_DEFAULT_GOLD_PATH)}",
).replace('sqlite:///', '')

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

ModelMessagesTypeAdapter: TypeAdapter = TypeAdapter(list[ModelMessage])

class AgentDeps(BaseModel):
    db_path: str = GOLD_DB_PATH
    model_config = {'arbitrary_types_allowed': True}

class AgentResult(BaseModel):
    answer: str
    sql_used: list[str] = Field(default_factory=list)
    tables_consulted: list[str] = Field(default_factory=list)
    out_of_scope: bool = False

provider = GoogleProvider(api_key=GEMINI_API_KEY)
model = GoogleModel('gemini-2.5-flash', provider=provider)

SYSTEM_PROMPT = """
Você é um Analista de Dados Sênior da V-Commerce, especializado em CRM e BI.

Sua missão é responder perguntas de negócio consultando o banco SQLite Gold.
Você deve SEMPRE usar as ferramentas antes de responder e nunca inventar dados.

Tabelas disponíveis:
- dim_cliente: dados cadastrais dos clientes
- dim_produto: catálogo de produtos e atributos descritivos
- dm_cliente_360: visão consolidada com uma linha por cliente
- dm_produto_360: visão consolidada com uma linha por produto
- dm_vendas_periodo: visão analítica agregada por período para análises temporais e comparativas

Regras obrigatórias:
1. Use get_schema quando precisar confirmar colunas.
2. Use apenas queries SELECT.
3. Nunca invente tabelas ou colunas.
4. Respeite o grão das tabelas.
5. Se a pergunta exigir granularidade que não existe, explique a limitação claramente.
6. Sempre preencha sql_used com os SQLs executados.
7. Sempre preencha tables_consulted com os nomes reais das tabelas usadas.
8. Se a pergunta estiver fora do escopo dos dados, marque out_of_scope=True.
9. Responda em português do Brasil.
10. Seja preciso e honesto; nunca estime números sem consulta.
11. Nunca use tabelas fora da lista permitida.
"""

crm_agent: Agent[AgentDeps, AgentResult] = Agent(
    model=model,
    deps_type=AgentDeps,
    output_type=AgentResult,
    system_prompt=SYSTEM_PROMPT,
)

def _extract_table_names(query: str) -> set[str]:
    matches = re.findall(r'\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)', query, flags=re.IGNORECASE)
    return set(matches)

@crm_agent.tool
def get_schema(ctx: RunContext[AgentDeps]) -> dict[str, Any]:
    with sqlite3.connect(ctx.deps.db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall() if row[0] in ALLOWED_TABLES]

        schema: dict[str, list[dict[str, Any]]] = {}
        for table in tables:
            cursor.execute(f'PRAGMA table_info(\"{table}\")')
            schema[table] = [
                {
                    'column': row[1],
                    'type': row[2],
                    'nullable': not row[3],
                }
                for row in cursor.fetchall()
            ]
        return schema

@crm_agent.tool
def execute_sql(
    ctx: RunContext[AgentDeps],
    query: str,
    params: list[Any] | None = None,
) -> dict[str, Any]:
    normalized = query.strip()
    upper_query = normalized.upper()

    if not upper_query.startswith("SELECT"):
        return {"error": "Apenas queries SELECT são permitidas."}

    if ";" in normalized.rstrip(";"):
        return {"error": "Múltiplas instruções SQL não são permitidas."}

    forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "ATTACH", "DETACH", "PRAGMA"]
    if any(token in upper_query for token in forbidden):
        return {"error": "Query contém comandos não permitidos."}

    used_tables = _extract_table_names(normalized)
    invalid_tables = used_tables - ALLOWED_TABLES
    if invalid_tables:
        return {"error": f"Tabelas não permitidas na query: {', '.join(sorted(invalid_tables))}"}

    try:
        with sqlite3.connect(ctx.deps.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params or [])
            rows = [dict(row) for row in cursor.fetchmany(200)]
            return {"rows": rows, "row_count": len(rows)}
    except sqlite3.Error as e:
        return {"error": f"Erro SQLite: {str(e)}"}

@crm_agent.tool_plain
def list_suggested_questions() -> list[str]:
    return [
        'Qual é a saúde financeira geral da empresa?',
        'Quem são os clientes VIP?',
        'Quantos clientes estão em risco de churn?',
        'Qual categoria de produto gera mais receita?',
        'Como evoluiu o ticket médio nos últimos 12 meses?',
        'Qual é o NPS médio?',
        'Qual estado teve maior receita?',
        'Qual método de pagamento é mais utilizado?',
        'Quais são os 5 produtos com maior receita total?',
    ]

async def run_agent(message: str, history_json: bytes | None = None):
    message_history: list[ModelMessage] = []
    if history_json and history_json not in (b"null", b""):
        message_history = ModelMessagesTypeAdapter.validate_json(history_json)

    deps = AgentDeps()
    result = await crm_agent.run(
        message,
        deps=deps,
        message_history=message_history,
    )
    updated_history = ModelMessagesTypeAdapter.dump_json(result.all_messages())
    return result.output, updated_history