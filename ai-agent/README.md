# Agente de IA - Stack OverGol

Este diretório existia para hospedar o código do agente de IA. Após a reorganização, ele passou a conter apenas esta documentação, toda a lógica vive dentro do `backend/`.

---

## Por que essa pasta ficou só com o README?

O agente é exposto como uma rota FastAPI (`POST /chat`) consumida pelo frontend. Como a orquestração precisa rodar dentro do mesmo processo que serve a API, manter um diretório `ai-agent/` separado significava duplicar uma série de coisas com o `backend/`:

| Item | Antes | Depois |
|---|---|---|
| Arquivo `.env` | `ai-agent/.env` + `backend/.env` (com chave Gemini só no primeiro) | `backend/.env` único |
| Arquivo `.env.example` | Dois, com instruções divergentes | Um, em `backend/.env.example` |
| `.gitignore` | `ai-agent/.gitignore` (só pra ignorar o `.env` da própria pasta) | Coberto pelo `.gitignore` raiz |
| `requirements.txt` | `pydantic-ai`, `pydantic` e `python-dotenv` repetidos em `ai-agent/requirements.txt` | Consolidado em `backend/requirements.txt` |
| Carregamento do `.env` | `backend/app/routes/chat.py` precisava chamar `load_dotenv("../ai-agent/.env")` manualmente antes de importar o serviço | Variáveis vêm naturalmente do `backend/.env` carregado em `bd/database.py` |

Sem a consolidação, qualquer pessoa que clonasse o projeto precisava configurar dois `.env`, instalar dois `requirements.txt` e entender por que o backend lia uma chave de fora do próprio diretório. Agora há um ponto único de configuração.

---

## Onde está o código

| Componente | Local |
|---|---|
| Serviço do agente (PydanticAI + Gemini, ferramentas, guardrails) | `backend/app/services/chat_service.py` |
| Rota FastAPI (`POST /chat`, `GET /chat/suggestions`, `DELETE /chat/session/{id}`) | `backend/app/routes/chat.py` |
| Variável `GEMINI_API_KEY` | `backend/.env` |
| Dependência `pydantic-ai[google]` | `backend/requirements.txt` |
| Banco consultado | `backend/bd/app_gold.db` (camada Gold) |

---

## Como o agente funciona

```
Usuário (pergunta em português)
        │
        ▼
POST /chat ──► chat_service.agent.run(message, history)
        │
        ▼
Gemini decide qual ferramenta chamar
        │
        ├──► ver_schema(tabela)      → retorna colunas e tipos
        │
        └──► executar_sql(query)     → valida + executa SELECT
                                       no app_gold.db
        ▼
Resposta em linguagem natural (resumo executivo → dados → análise → recomendação)
```

### Fluxo de uma pergunta

1. O frontend manda `{ session_id, message }` para `POST /chat`.
2. A rota recupera o histórico daquela `session_id` (dicionário em memória) e chama `agent.run(message, message_history=history)`.
3. O Gemini lê o `system_prompt`, decide chamar `ver_schema` em uma ou mais tabelas relevantes, monta um `SELECT`, chama `executar_sql`, interpreta o retorno e devolve a resposta final em português.
4. O histórico atualizado é guardado para a próxima mensagem da mesma sessão.

### Ferramentas expostas ao modelo

| Ferramenta | O que faz |
|---|---|
| `ver_schema(tabela)` | Retorna nome e tipo das colunas de uma tabela permitida. |
| `executar_sql(query)` | Executa uma query `SELECT` no banco Gold e devolve as linhas como texto. |

---

## Decisões técnicas

### 1. O agente só enxerga a camada Gold

A `ALLOWED_TABLES` lista apenas cinco tabelas:

```python
ALLOWED_TABLES = {
    "dim_cliente", "dim_produto",
    "dm_cliente_360", "dm_produto_360", "dm_vendas_periodo",
}
```

Essas tabelas já vêm enriquecidas pelo pipeline de dados (LTV, recência, NPS, ticket médio etc.), então o agente respondendo perguntas de negócio raramente precisa de `JOIN`s complexos - uma única tabela costuma resolver. Limitar o escopo reduz a probabilidade do modelo "inventar" queries pesadas ou acessar tabelas operacionais cruas.

### 2. O system prompt expõe nomes de tabelas, mas **não** colunas

`_get_table_names` injeta apenas a lista de tabelas permitidas no prompt do sistema. As colunas o agente descobre sob demanda chamando `ver_schema`. Por que:

- Carregar o schema completo (todas as tabelas + todas as colunas) custaria milhares de tokens a cada conversa, com a maioria das colunas sendo irrelevante para a pergunta atual.
- Pagar tokens só quando o modelo realmente precisa deixa a conversa mais barata e mantém o prompt curto.

### 3. Quatro camadas de validação em `executar_sql`

Mesmo confiando no modelo, a função executa quatro checagens antes de deixar a query chegar ao SQLite:

1. **Prefixo `SELECT`** - a query precisa começar com `SELECT` após `strip`. Rejeita `INSERT`, `UPDATE`, etc., já na entrada.
2. **Sem múltiplas instruções** - `;` no meio da query é bloqueado (defesa contra `SELECT 1; DROP TABLE x`).
3. **Tokens proibidos** - busca textual por `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `ATTACH`, `DETACH`, `PRAGMA`. Cobre tentativas escondidas em subqueries ou CTEs.
4. **Whitelist textual de tabelas** - um regex extrai os nomes após `FROM`/`JOIN`; se algum não estiver em `ALLOWED_TABLES`, a query é rejeitada.

Defesa em camadas: a guarda 1 sozinha já seria contornável (`SELECT * FROM x; DROP TABLE y`), mas combinada com 2, 3 e 4 fecha o cerco.

### 4. Agente como singleton

`_create_agent()` é executado uma única vez quando o módulo é importado, e a instância fica guardada em `agent = _create_agent()`. As rotas reutilizam essa instância em todas as requisições. Isso evita reconstruir o `Agent`, reler o schema das tabelas e reanexar as ferramentas a cada chamada - operações que não dependem da pergunta.

### 5. `@agent.tool_plain` em vez de `@agent.tool`

A diferença no PydanticAI:

- `@agent.tool` injeta um `RunContext` como primeiro argumento da função (útil para acessar histórico, dependências, etc.).
- `@agent.tool_plain` registra uma função pura - recebe só os argumentos da chamada do modelo.

`ver_schema` e `executar_sql` não precisam do contexto da execução, então usar `tool_plain` deixa as assinaturas mais limpas (`def ver_schema(tabela: str) -> str:`) e o código mais fácil de testar isoladamente.

### 6. Histórico de sessão em memória

`chat.py` mantém `_sessions: dict[str, list]` como cache em memória do processo. A escolha é deliberada para esta fase:

- Não precisa de Redis/DB extra - uma dependência a menos.
- Reinício do servidor zera as conversas (aceitável, já que não são dados auditáveis).
- O `session_id` vem do frontend, então sessões diferentes ficam isoladas.

Se for necessário persistir histórico (auditoria, retomada após restart), o ponto de troca é único: substituir o `dict` por um backend persistente sem mudar a rota.

---

## Estruturação no projeto

```
projeto-final-rocketlab-grupo-1/
├── ai-agent/
│   └── README.md                          ← este arquivo (só documentação)
└── backend/
    ├── .env                               ← GEMINI_API_KEY mora aqui
    ├── .env.example                       ← template
    ├── requirements.txt                   ← inclui pydantic-ai[google]
    └── app/
        ├── routes/
        │   └── chat.py                    ← POST /chat, GET /chat/suggestions, DELETE /chat/session
        └── services/
            └── chat_service.py            ← Agent, ferramentas, guardrails, prompt
```

A separação entre `routes/chat.py` (camada HTTP/sessão) e `services/chat_service.py` (lógica do agente) segue o padrão dos outros recursos do backend (`cliente`, `produto`, `pedido`, etc.). Para quem já entende como os outros módulos do backend funcionam, o agente não tem nenhuma surpresa de arquitetura.

---

## Modelos suportados pela API key free

A `GEMINI_API_KEY` gratuita do Google AI Studio tem limites diários por modelo. Quando a quota do modelo padrão esgota, dá pra trocar editando a linha em `backend/app/services/chat_service.py`:

```python
model = GeminiModel("gemini-2.5-flash")   # <- trocar o nome aqui
```

Os três modelos abaixo são confirmados pela API key free e atendem ao agente sem mudança de código:

| Identificador | Quando usar | Trade-off |
|---|---|---|
| `gemini-2.5-flash` | **Padrão.** Melhor qualidade de raciocínio para text-to-SQL. | Quota diária menor - esgota primeiro em uso intenso. |
| `gemini-2.5-flash-lite` | Quando a quota do `2.5-flash` acabou. | Respostas um pouco mais simples, mas ainda gera SQL correto para perguntas comuns. |
| `gemini-2.0-flash` | Plano B se ambos os 2.5 falharem. | Geração mais literal - pode ignorar nuances do prompt. Quota separada das versões 2.5. |

A troca do `2.5-flash` para `2.5-flash-lite` costuma resolver imediatamente problema de limite de uso.

---

## Como rodar

```bash
cd backend
venv\Scripts\activate # Windows
uvicorn main:app --reload
```

Pré-requisitos:

- `backend/.env` com `GEMINI_API_KEY` válida (https://aistudio.google.com/apikey).
- `backend/bd/app_gold.db` populado (`python bd/seed.py` se ainda não existir).

Documentação interativa: http://localhost:8000/docs (tag **Agente IA**).