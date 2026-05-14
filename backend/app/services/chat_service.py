# ----------chat_service.py - Agente de IA do CRM (Stack OverGol)----------

# RESPONSABILIDADE DESTE ARQUIVO:
# Configurar o agente IA que responde perguntas em linguagem natural sobre os dados da empresa V-Commerce.

# COMO FUNCIONA (visão geral):
# 1. O agente recebe a pergunta do usuário em português.
# 2. O modelo decide quais ferramentas usar para encontrar a resposta, sem que nós precisemos escrever o SQL.
# 3. O Gemini consulta as colunas da tabela relevante (ver_schema), monta a query SQL, executa (executar_sql) e interpreta o resultado.
# 4. A resposta final é entregue em linguagem natural, formatada.

# FERRAMENTAS DISPONÍVEIS PARA O AGENTE:
# - ver_schema(tabela)  → retorna as colunas de uma tabela
# - executar_sql(query) → executa um SELECT e retorna os dados

# FERRAMENTAS PLANEJADAS (em breve):
# - listar_valores_distintos(tabela, coluna) → retorna os valores únicos de uma coluna.
# Necessário para lidar com inconsistências nos dados, como "PE" vs "Pernambuco", antes de montar filtros no SQL.

# INTEGRAÇÃO FUTURA:
#   Este arquivo será importado pela rota FastAPI em:
#   backend/app/routes/chat.py  →  POST /api/chat

import os
import sqlite3
from pydantic_ai import Agent
from pydantic_ai.models.gemini import GeminiModel

# ----------CAMINHO DO BANCO DE DADOS----------
# Por padrão, usa o banco Gold gerado pela parte de dados em backend/bd/.
# Pode ser sobrescrito via variável de ambiente GOLD_DB_PATH para ambientes diferentes.
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_DB_PATH = os.getenv("GOLD_DB_PATH", os.path.join(_BACKEND_DIR, "bd", "app_gold.db"))


def _get_table_names() -> str:
    """
    Retorna apenas os nomes das tabelas do banco Gold como uma string.

    Por que só os nomes e não as colunas?
    - Carregar o schema completo (todas as tabelas + todas as colunas) no prompt do sistema consumiria milhares de tokens a cada conversa.
    - Ao invés disso, o agente descobre as colunas sob demanda usando a ferramenta ver_schema(), pagando tokens só quando necessário.
    """
    try:
        with sqlite3.connect(_DB_PATH) as conn:
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            tables = [r[0] for r in cur.fetchall()]
            return ", ".join(tables)
    except Exception as e:
        return f"[tabelas indisponíveis: {e}]"


def _create_agent() -> Agent:
    """
    Constrói e retorna o agente PydanticAI configurado com Gemini 2.5 Flash.

    Esta função é chamada UMA VEZ quando o módulo é importado. O agente criado é reutilizado em todas as conversas (padrão singleton).
    Evitando re-inicialização a cada requisição.
    """

    # Busca os nomes das tabelas para incluir no prompt do sistema.
    # Isso orienta o Gemini sobre quais dados existem, sem revelar colunas.
    table_names = _get_table_names()

    # ----------MODELO DE IA----------
    # Gemini 2.5 Flash, pode ser trocado para o lite.
    # A chave da API vem da variável de ambiente GEMINI_API_KEY.
    # A chave é lida automaticamente da variável de ambiente GEMINI_API_KEY
    model = GeminiModel("gemini-2.0-flash")

    # ----------PROMPT DO SISTEMA----------
    # O system prompt é a "instrução permanente" enviada ao modelo em toda conversa. Ele define:
    # - Quem o agente é e qual é seu papel (persona prompting)
    # - Quais tabelas existem no banco
    # - O que está dentro e fora do escopo permitido, para evitar respostas sobre python por exemplo.
    # - As regras de comportamento e formato de resposta
    system_prompt = f"""Você é um Analista de Dados Sênior da empresa V-Commerce, especializado em CRM e BI.

Você tem acesso ao banco de dados Gold da empresa, com informações detalhadas sobre clientes, vendas, produtos, pedidos, avaliações e suporte. Sua missão é responder perguntas dos usuários consultando esse banco.

TABELAS DISPONÍVEIS NO BANCO:
{table_names}

FLUXO DE TRABALHO OBRIGATÓRIO para qualquer pergunta sobre clientes, vendas, produtos, pedidos, avaliações, suporte, receita, LTV, churn, NPS, satisfação, engajamento ou qualquer métrica de negócio:
1. Chame `ver_schema` na(s) tabela(s) que parecem relevantes para conhecer as colunas
2. Chame `executar_sql` com uma query SELECT bem formada
3. Interprete o resultado e responda em linguagem natural

NUNCA recuse uma pergunta sem antes tentar consultar as tabelas. Se não souber qual tabela usar, comece chamando `ver_schema` nas tabelas que pareçam mais prováveis.

REGRAS DE SQL:
- Apenas queries SELECT (leitura) - jamais INSERT, UPDATE, DELETE ou DROP
- Aplique LIMIT quando a query puder retornar muitas linhas
- Nunca invente valores; sempre busque do banco

FORMATO DE RESPOSTA:
- Português brasileiro, tom profissional mas amigável
- Valores monetários: R$ X.XXX,XX (2 casas decimais)
- Percentuais: 1 casa decimal
- Estrutura: resumo executivo → dados principais → análise → recomendação (quando aplicável)

QUANDO RECUSAR (apenas nestes casos):
Se - e somente se - a pergunta for claramente sobre um assunto não relacionado ao negócio (ex: como programar, receitas de culinária, história, política, conselhos pessoais), responda:
"Sou um analista de dados da V-Commerce e só posso responder perguntas sobre os dados da empresa. Posso ajudar com vendas, clientes, produtos ou suporte?"

Em caso de dúvida sobre se a pergunta está no escopo, ASSUMA QUE ESTÁ e tente consultar o banco primeiro."""

    # ----------CRIAÇÃO DO AGENTE----------
    # Agent() é a classe principal do PydanticAI. Ela gerencia internamente:
    # - O envio de mensagens ao modelo
    # - O loop de ferramentas: modelo chama ferramenta - recebe resultado - decide se chama outra ou já responde
    # - O histórico de conversa (passado via message_history no .run())
    agent = Agent(model, system_prompt=system_prompt)

    # ----------FERRAMENTA: ver_schema----------
    # O decorador @agent.tool_plain registra esta função como uma ferramenta que o Gemini pode chamar quando quiser.
    #
    # Por que "tool_plain" e não "tool"?
    # - tool_plain: a função recebe apenas os argumentos normais (simples)
    # - tool: a função recebe também o RunContext (contexto da execução)
    # Aqui não precisamos do contexto, então tool_plain é suficiente.
    #
    # Fluxo típico de uso "Usuário pergunta sobre receita por categoria"
    # - Gemini chama: ver_schema("dm_vendas_periodo")
    # - Recebe as colunas disponíveis
    # - Monta o SELECT correto
    @agent.tool_plain
    def ver_schema(tabela: str) -> str:
        """Retorna as colunas e tipos de uma tabela do banco de dados."""
        try:
            with sqlite3.connect(_DB_PATH) as conn:
                cur = conn.cursor()
                # PRAGMA table_info é o comando SQLite para inspecionar colunas.
                # Retorna: cid, name, type, notnull, dflt_value, pk
                cur.execute(f"PRAGMA table_info(`{tabela}`)")
                cols = cur.fetchall()
            if not cols:
                return f"Tabela '{tabela}' não encontrada."
            # Retorna nome e tipo de cada coluna no formato "  nome_coluna (TEXT)"
            return "\n".join(f"  {c[1]} ({c[2]})" for c in cols)
        except Exception as e:
            return f"Erro ao ler schema: {e}"

    # ----------FERRAMENTA: executar_sql----------
    # Executa o SQL que o Gemini montou e retorna os dados como texto.
    
    # SEGURANÇA: só permite queries que começam com SELECT, bloqueando qualquer tentativa de modificar ou apagar dados do banco.
    
    # Fluxo típico de uso (continuação do exemplo acima):
    # - Gemini chama: executar_sql("SELECT categoria_produto, SUM(valor_pedido)
    #                               FROM dm_vendas_periodo GROUP BY ...")
    # - Recebe os dados como lista de dicionários
    # - Formula a resposta em linguagem natural
    @agent.tool_plain
    def executar_sql(query: str) -> str:
        """Executa uma query SQL SELECT no banco Gold e retorna os resultados."""
        sql = query.strip()

        # Barreira de segurança: rejeita qualquer coisa que não seja SELECT
        if not sql.upper().startswith("SELECT"):
            return "Erro: apenas queries SELECT são permitidas."

        try:
            with sqlite3.connect(_DB_PATH) as conn:
                # row_factory transforma cada linha em um dicionário, facilitando a leitura pelo modelo (chave: valor)
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(sql)
                rows = [dict(r) for r in cur.fetchall()]

            if not rows:
                return "Nenhum resultado encontrado."

            return str(rows)
        except Exception as e:
            return f"Erro ao executar SQL: {e}"

    # ----------FERRAMENTA PLANEJADA: listar_valores_distintos----------
    
    # Objetivo: retornar os valores únicos de uma coluna antes de filtrar.
    
    # Sem essa ferramenta, o Gemini pode gerar WHERE estado_cliente = 'Pernambuco' e não encontrar nenhum resultado, mesmo havendo dados válidos.

    return agent

# ----------INSTÂNCIA GLOBAL DO AGENTE----------
# O agente é criado uma única vez aqui, quando o módulo é importado.
agent = _create_agent()