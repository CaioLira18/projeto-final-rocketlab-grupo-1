# Frente de Desenvolvimento — v commerce CRM

Documentação técnica completa da frente **Dev** do projeto.
Produto: **v commerce** · Equipe: **StackOverGol**.

Este arquivo é o ponto de entrada para qualquer pessoa que precise rodar, evoluir ou revisar o lado de aplicação (frontend + backend) do CRM. O projeto possui três frentes documentadas separadamente — **Dados**, **Dev** e **IA** — e este documento cobre exclusivamente **Dev**.

> Frentes irmãs:
> - **Dados**: pipeline Medalhão no Databricks — ver `README.md` (seção "Arquitetura e Fluxo de Dados") e o PDF "Documentação Fluxo de Dados" no repositório.
> - **IA**: agente text-to-SQL — ver `README.md` de `ai-agent/`.

---

## Sumário

1. [Setup — Rodando o projeto (Docker)](#1-setup--rodando-o-projeto-docker)
2. [Stack tecnológica](#2-stack-tecnológica)
3. [Funcionamento geral](#3-funcionamento-geral)
4. [Decisões de arquitetura — Backend](#4-decisões-de-arquitetura--backend)
5. [Decisões de arquitetura — Frontend](#5-decisões-de-arquitetura--frontend)
6. [Decisões de Docker e ambiente](#6-decisões-de-docker-e-ambiente)
7. [Fallback: rodando sem Docker](#7-fallback-rodando-sem-docker)

---

## 1. Setup — Rodando o projeto (Docker)

A aplicação é **100% containerizada** com Docker Compose. O caminho oficial para desenvolvimento é este — não há mais necessidade de gerenciar `venv` Python ou `node_modules` na máquina host.

### 1.1. Pré-requisitos

| Item | Versão mínima | Observação |
|---|---|---|
| Docker Desktop | 4.x (Compose v2 embutido) | Windows / macOS / Linux |
| Git | qualquer | Para clonar o repositório |

> Compose v1 (`docker-compose` com hífen) foi descontinuado pela Docker em junho/2023. Use sempre `docker compose` (sem hífen).

### 1.2. Passo a passo

**1) Clonar e configurar variáveis de ambiente**

```bash
git clone <url-do-repo>
cd projeto-final-rocketlab-grupo-1
cp backend/.env.example backend/.env
```

Edite `backend/.env` e preencha pelo menos:
- `GEMINI_API_KEY` — chave da Google AI Studio (gerada em https://aistudio.google.com/apikey). Necessária para o agente de IA responder.
- `DATABRICKS_HOST` / `DATABRICKS_TOKEN` — opcionais; só são usados pelos scripts de upload/download em `backend/bd/`.

**2) Subir os containers**

```bash
docker compose up --build
```

Na primeira execução o build leva alguns minutos (instala `pip` e `npm`). Nas subsequentes o cache de camadas torna o startup quase instantâneo.

**3) Popular o banco (seed inicial)**

Em outro terminal, com os containers já de pé:

```bash
docker compose exec backend python bd/seed.py
```

Esse seed cria as tabelas Silver/Gold a partir dos CSVs em `backend/data/` e gera os usuários de teste (um por role — credenciais listadas no `README.md`, seção "Usuários seed por role").

### 1.3. Endereços

| Serviço | URL | O que é |
|---|---|---|
| Frontend | http://localhost:5173 | App React/Vite com HMR |
| Backend | http://localhost:8000 | API FastAPI (rota raiz devolve boas-vindas em pt-BR) |
| Swagger | http://localhost:8000/docs | Documentação interativa da API, com botão "Try it out" |
| ReDoc | http://localhost:8000/redoc | Mesma documentação em formato leitura |
| Health check | http://localhost:8000/health | `{"status": "ok"}` — útil para probes |

### 1.4. Comandos úteis do dia a dia

```bash
# Logs em tempo real (Ctrl+C só desconecta, não derruba)
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar um serviço sem rebuildar
docker compose restart backend

# Forçar rebuild (após mudar Dockerfile ou requirements.txt / package.json)
docker compose up --build --force-recreate

# Derrubar tudo (mantém volumes/dados)
docker compose down

# Derrubar e apagar volumes anônimos (limpa node_modules / venv do container)
docker compose down -v

# Abrir shell no container backend
docker compose exec backend bash

# Rodar comando único no backend
docker compose exec backend python bd/seed.py
docker compose exec backend python bd/upload_to_databricks.py
docker compose exec backend python bd/download_from_databricks.py
```

### 1.5. Hot reload

Os volumes bind-mount em `docker-compose.yml` espelham o código local dentro do container:

- **Backend**: salvar qualquer `.py` faz o uvicorn (`--reload`) detectar e reiniciar.
- **Frontend**: salvar qualquer `.tsx`/`.css` aciona o HMR do Vite — a mudança aparece no navegador sem refresh.

Não é preciso rebuildar a imagem para mudanças de código — só para mudanças de dependências (`requirements.txt`, `package.json`) ou de `Dockerfile`.

### 1.6. Persistência de dados

A pasta `backend/bd/` é montada como volume bidirecional. Os arquivos `app_silver.db` e `app_gold.db` ficam **na sua máquina** — `docker compose down` não apaga nada. Para zerar tudo:

```bash
docker compose down
rm backend/bd/app_silver.db backend/bd/app_gold.db
docker compose up -d
docker compose exec backend python bd/seed.py
```

---

## 2. Stack tecnológica

### 2.1. Backend — Python · FastAPI

| Lib | Versão | Para que serve |
|---|---|---|
| `fastapi` | 0.110 | Framework web assíncrono, geração automática de Swagger/OpenAPI |
| `uvicorn` | 0.29 | Servidor ASGI que roda a app FastAPI (modo `--reload` em dev) |
| `sqlalchemy` | 2.0 | ORM para mapear modelos Python ↔ tabelas SQLite |
| `pydantic` | 2.13 | Validação dos schemas de request/response da API |
| `pydantic-settings` | 2.2 | Lê variáveis do `.env` com tipagem |
| `python-dotenv` | 1.0 | Carrega o `.env` no startup |
| `pyjwt` | 2.8 | Codifica/decodifica tokens JWT da autenticação |
| `bcrypt` | 4.1 | Hash de senhas com salt |
| `python-multipart` | 0.0.9 | Suporte a `multipart/form-data` (forms HTML) |
| `pandas` | 2.2 | Manipulação dos CSVs no seed e nos scripts Databricks |
| `databricks-cli` | 0.18 | SDK para upload/download de volumes Unity Catalog |
| `pydantic-ai-slim[google]` | 1.98 | Agente IA com tools (Gemini provider) |

### 2.2. Frontend — React 19 · TypeScript · Vite

| Dependência | Versão | Para que serve |
|---|---|---|
| `react` / `react-dom` | 19.2 | Biblioteca de UI |
| `react-router-dom` | 7.15 | Roteamento (`createBrowserRouter`, rotas aninhadas, guards) |
| `typescript` | 6.0 | Tipagem estática estrita (`strict` ligado) |
| `vite` | 8.0 | Bundler/dev server com HMR e ESM nativo |
| `@vitejs/plugin-react` | 6.0 | Integração React no Vite |
| `tailwindcss` / `@tailwindcss/vite` | 4.3 | Estilização utility-first (config via CSS, sem `tailwind.config.js`) |
| `clsx` | 2.1 | Concatenação condicional de classes |
| `tailwind-merge` | 3.6 | Resolve conflitos entre utilities Tailwind |
| `recharts` | 3.8 | Gráficos do dashboard (Area, Bar, Pie) |
| `lucide-react` | 1.14 | Ícones SVG tree-shakable |

### 2.3. Banco de dados — SQLite (Silver + Gold)

Dois arquivos `.db` separados, intencionalmente:

| Banco | Arquivo | Conteúdo | Quem usa |
|---|---|---|---|
| **Silver** | `backend/bd/app_silver.db` | Dados operacionais limpos: `dim_cliente`, `dim_produto`, `fato_vendas`, `fato_suporte`, `fato_avaliacoes`, `usuarios` | Endpoints CRUD/listagem |
| **Gold** | `backend/bd/app_gold.db` | Dados analíticos pré-agregados: `dm_cliente_360`, `dm_produto_360`, `dm_vendas_periodo` | Dashboard, visão 360, agente IA |

A escolha do SQLite garante zero-setup (sem servidor de banco para subir) e total portabilidade — o arquivo é tratado como artefato versionável e o desenvolvedor já sobe o projeto com dados reais prontos. O código SQLAlchemy está pronto para migração futura para PostgreSQL: basta trocar `DATABASE_URL_SILVER` / `DATABASE_URL_GOLD` no `.env`.

### 2.4. Infraestrutura de desenvolvimento

| Item | Tecnologia |
|---|---|
| Containerização | Docker + Docker Compose v2 |
| Imagens base | `python:3.11-slim` (backend) · `node:20-alpine` (frontend) |
| Hot reload | Volumes bind-mount + `uvicorn --reload` + Vite HMR |

---

## 3. Funcionamento geral

### 3.1. Fluxo de uma requisição típica

```
Browser ──► Frontend (Vite, porta 5173)
                │
                │   apiFetch() em src/services/index.ts
                │   Authorization: Bearer <JWT>
                ▼
            Backend (FastAPI, porta 8000)
                │
                │   1. CORSMiddleware permite o origin
                │   2. RoleChecker (Depends) valida JWT + role
                │   3. Router despacha para o handler
                │   4. Handler chama service
                │   5. Service usa SessionSilver ou SessionGold
                ▼
            SQLite (app_silver.db / app_gold.db)
```

### 3.2. Autenticação — JWT

- O usuário faz `POST /auth/login` com e-mail e senha.
- O backend valida (bcrypt) e retorna `{ access_token, token_type: "bearer" }`. O token expira em 60 min.
- O frontend guarda o token em `localStorage` e injeta `Authorization: Bearer <token>` em toda chamada via `apiFetch()`.
- Cada rota protegida usa `Depends(get_current_user)` para decodificar o JWT e carregar o `Usuario` do banco.

### 3.3. RBAC em duas camadas

A autorização é redundante de propósito — o backend é a fonte da verdade, mas o frontend antecipa a checagem para esconder o que o usuário não pode usar:

| Camada | Onde | Para quê |
|---|---|---|
| **Backend** | `backend/app/routes/dependencies.py` (`require_*`) | Bloqueia a requisição com 403 se a role não tem acesso |
| **Frontend** | `frontend/src/hooks/usePermission.ts` (`can('capability')`) | Esconde itens do menu lateral, esconde botões de ação, redireciona rotas inacessíveis |

**Importante**: alterações em uma camada exigem espelhamento na outra. A matriz completa está no `README.md` (seção "Matriz de permissões").

### 3.4. Cache de KPIs

`GET /dashboard/kpis` é a chamada mais cara da API (vários agregados em cima da Gold). O resultado é cacheado em memória do processo. O frontend dispara recálculo passando `?sync=true` quando o usuário clica em "Sincronizar".

### 3.5. Stream CSV

Os endpoints `/export/*` usam `StreamingResponse` em vez de carregar tudo em memória — isso permite exportar tabelas grandes sem inchar o processo Python.

---

## 4. Decisões de arquitetura — Backend

### 4.1. Estrutura modular `app/{routes,schemas,services,models}`

```
backend/
├── app/
│   ├── routes/     # FastAPI APIRouters (camada de transporte)
│   ├── schemas/    # Pydantic (validação de entrada/saída)
│   ├── services/   # Lógica de negócio e queries SQLAlchemy
│   └── models/     # SQLAlchemy ORM (mapeamento tabela ↔ classe)
├── bd/
│   ├── database.py # Engines, sessions e get_db / get_db_gold
│   └── seed.py     # Popula tabelas a partir dos CSVs
└── main.py         # Bootstrap: FastAPI(), CORS, include_router
```

**Por quê**: a separação rotas/serviços/modelos é o padrão de mercado para projetos FastAPI de médio porte. Mantém handlers finos (validação + chamada de serviço) e concentra a lógica de banco em um lugar testável. Os schemas Pydantic ficam isolados porque mudam por motivos diferentes dos models SQLAlchemy.

### 4.2. Dois bancos SQLite — Silver e Gold

`database.py` cria **dois engines** (`engine_silver`, `engine_gold`) e expõe duas dependências (`get_db`, `get_db_gold`). Cada router escolhe qual usar:

```python
@router.get("/")                           # silver
def listar_pedidos(db: Session = Depends(get_db)): ...

@router.get("/metricas")                    # gold
def listar_metricas(db_gold: Session = Depends(get_db_gold)): ...
```

**Por quê**: a separação reflete a Arquitetura Medalhão da frente de Dados. Silver é o "sistema transacional" (CRUD, listagens filtradas), Gold é o "data mart" (agregados pré-calculados que vêm prontos do Databricks). Tratar como dois bancos:
- evita misturar tabelas de propósitos diferentes na mesma sessão;
- permite substituir só o Gold quando o pipeline rodar (`download_from_databricks.py`), sem mexer no Silver;
- documenta na assinatura do handler de onde os dados vêm.

### 4.3. `RoleChecker` como dependency do FastAPI (não middleware)

A autorização é injetada em cada router como dependência:

```python
router = APIRouter(prefix="/produtos", dependencies=[Depends(require_produtos_read)])
```

**Por quê (não middleware)**: middleware roda antes da resolução de rota, ou seja, não sabe qual capacidade a rota exige. Como dependency, cada router declara explicitamente o que precisa, fica documentado no Swagger, e o `admin` recebe bypass por curto-circuito interno (`if current_user.role == "admin": return current_user`).

### 4.4. Matriz de roles em `dependencies.py`

Todas as `require_*` são instâncias de `RoleChecker(["role1", "role2", ...])` agrupadas no mesmo arquivo.

**Por quê**: ter as listas em um único arquivo torna a matriz auditável de relance — abrir uma PR que mude permissão fica óbvio. Cada constante tem um comentário explicando por que cada role está dentro/fora.

### 4.5. Sessions de chat em memória (`dict[str, list]`)

O histórico de conversa do agente IA é guardado num dicionário Python na própria instância do uvicorn:

```python
_sessions: dict[str, list] = {}
```

**Por quê**: simplicidade. O CRM tem um único worker em dev e poucos usuários simultâneos, então persistir em Redis/banco seria over-engineering. O trade-off é claro e aceito: reiniciar o backend zera o histórico.

### 4.6. Whitelist do agente IA — SELECT + tabelas permitidas

Em `chat_service.py`, a tool `executar_sql` impõe três defesas em camadas:

1. Só queries que começam com `SELECT`.
2. Bloqueia tokens proibidos (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ATTACH`, etc.) mesmo em subqueries.
3. Whitelist de tabelas (`ALLOWED_TABLES`): só `dim_cliente`, `dim_produto`, `dm_cliente_360`, `dm_produto_360`, `dm_vendas_periodo`.

**Por quê**: defesa em profundidade. Mesmo que o LLM gere SQL malicioso (prompt injection do usuário), uma das três camadas pega. Bloquear por checagem textual antes de chegar no SQLite evita classes inteiras de ataque sem custo de performance.

### 4.7. Schema do agente carregado sob demanda (`ver_schema`)

O system prompt do agente lista apenas **nomes** de tabelas — não as colunas. Quando o modelo precisa, chama a tool `ver_schema(tabela)`.

**Por quê**: carregar o schema completo (todas as colunas de todas as tabelas) no system prompt consumiria milhares de tokens em **toda** conversa. Sob demanda paga-se o custo só quando relevante.

### 4.8. `X-Total-Count` em vez de envelope `{items, total}`

Endpoints paginados expõem o total no header HTTP:

```python
response.headers["X-Total-Count"] = str(total)
return [...]
```

E o `CORSMiddleware` expõe esse header explicitamente em `expose_headers=["X-Total-Count"]`.

**Por quê**: mantém a resposta JSON limpa (uma lista é uma lista) e segue uma convenção HTTP estabelecida. O frontend lê o header sem precisar mudar a tipagem do array de itens.

### 4.9. Senhas em bcrypt — `get_password_hash` + `verify_password`

Senhas são hash bcrypt com salt automático (`bcrypt.gensalt()`). Nunca armazenamos texto puro nem hash sem salt.

**Por quê**: bcrypt é o padrão da indústria para senhas há ~25 anos — custo computacional ajustável (dificulta brute-force) e salt embutido (anula rainbow tables).

### 4.10. Sem Alembic - schema gerenciado por `drop_all` + `create_all` no seed

O `bd/seed.py` recria o schema do zero a cada execução:

```python
Base.metadata.drop_all(bind=engine_silver)
BaseGold.metadata.drop_all(bind=engine_gold)
Base.metadata.create_all(bind=engine_silver)
BaseGold.metadata.create_all(bind=engine_gold)
```

Não há diretório `alembic/` nem `alembic.ini` no projeto. O Alembic chegou a ser cogitado no início mas nunca foi adotado, e a dependência foi removida do `requirements.txt`.

**Por quê abandonamos**: o ciclo de desenvolvimento do CRM é "mudou o model SQLAlchemy → roda o seed de novo". Os dados de Silver e Gold vêm de CSVs versionados (camadas Silver entregue pelo pipeline e Gold baixada do Databricks), então **destruir e recriar é barato e sempre converge para um estado conhecido**. Alembic faria sentido se tivéssemos dados de produção que precisam ser preservados entre alterações de schema - não é o caso aqui, onde o banco é um cache local reconstruível.

**Trade-off aceito**: nenhum histórico de migrations, nenhum rollback granular. Se um dia o projeto for para produção com dados que não podem ser perdidos, Alembic precisa ser introduzido antes - e o primeiro `alembic revision --autogenerate` partirá do schema atual como baseline.

### 4.11. `redirect_slashes=False` no router de clientes

```python
router = APIRouter(prefix="/clientes", redirect_slashes=False, ...)
```

**Por quê**: o FastAPI por padrão responde 307 redirect entre `/clientes` e `/clientes/`. Em chamadas autenticadas com Bearer Token, alguns clientes HTTP perdem o header no redirect — causa 401 intermitente. Desligar evita o problema.

---

## 5. Decisões de arquitetura — Frontend

### 5.1. Estrutura por feature (`pages/<feature>/`)

```
src/
├── components/
│   ├── ui/       # primitivos reutilizáveis (Button, Input, Logo, UseToast)
│   ├── layout/   # NavBar e shells de página
│   ├── charts/   # placeholder para gráficos compartilhados
│   └── shared/   # placeholder para data tables, searches genéricos
├── pages/
│   ├── auth/{Login, Register}
│   ├── clientes/{Clientes, components/Cliente360Modal}
│   ├── produtos/{Produtos, components/Product*}
│   ├── pedidos/Pedidos
│   ├── suporte/Suporte
│   ├── ai-agent/AiAgent
│   └── Home.tsx  (dashboard)
├── context/      # AuthContext
├── hooks/        # usePermission
├── services/     # apiFetch (camada HTTP)
├── router/       # createBrowserRouter + guards
├── types/        # tipos compartilhados
└── utils/        # cn() (clsx + tailwind-merge)
```

**Por quê**: cada feature carrega junto a sua página principal e os componentes que só ela usa (modais, cards específicos). Componentes verdadeiramente compartilhados sobem para `components/ui` ou `components/shared`. Reduz acoplamento e facilita deletar/mover uma feature inteira.

### 5.2. Path alias `@/*` apontando para `src/`

Tanto `vite.config.ts` quanto `tsconfig.app.json` mapeiam `@/*` → `./src/*`. Toda importação interna usa o alias:

```ts
import { Button } from "@/components/ui"
import { useAuth } from "@/context"
```

**Por quê**: imports relativos longos (`../../../components/ui`) quebram quando arquivos são movidos. O alias mantém imports estáveis e legíveis.

### 5.3. Design system via `@theme` do Tailwind 4 (sem `tailwind.config.js`)

Em `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #1A2B4C;
  --color-secondary: #7C3AED;
  --text-h1: 32px;
  ...
}
```

**Por quê**: o Tailwind 4 movou a configuração para CSS via `@theme`. Vantagens:
- design tokens viram CSS variables nativas — acessíveis fora do Tailwind também;
- não há `tailwind.config.js` em JS para manter;
- todo o style guide (cores, tipografia, raios, sombras) fica num único arquivo, ancorado no Figma.

### 5.4. Componente `Button` — `variant` × `size` × `intent`

`src/components/ui/Button.tsx` expõe três dimensões ortogonais:

| Prop | Valores | O que controla |
|---|---|---|
| `variant` | `filled` / `outlined` / `ghost` | **Forma** visual: preenchido, com borda, transparente |
| `size` | `sm` / `md` / `lg` | **Tamanho** (altura, padding, font-size, radius) |
| `intent` | `success` / `action` / `primary` / `secondary` / `error` / `warning` | **Cor temática** (opcional) |

**Por quê essa separação**: cada eixo responde a uma pergunta diferente:
- `variant`: que tipo de botão é? (CTA principal vs. ação secundária vs. ação inline)
- `size`: que peso visual ele tem? (header de modal vs. cell de tabela)
- `intent`: que significado semântico? (success = confirmar, error = excluir, warning = alertar)

Sem `intent`, o botão cai numa **forma base neutra** (verde-success para `filled`, branco/escuro para `ghost`, etc.). Com `intent`, ganha cor temática mantendo a forma. Isso evita explosão combinatória — em vez de 3 variants × 6 intents × 3 sizes = 54 classes de botão, o componente compõe.

A vitrine ao vivo está em `/botoes-teste` (rota pública, fora do `ProtectedRoute`) — útil para olhar antes de chamar `<Button>`.

### 5.5. Componente `Input` — `forwardRef` com label, erro e ícone

`src/components/ui/Input.tsx` usa `forwardRef` para repassar a ref para o `<input>` nativo, e aceita:
- `label` (opcional, renderiza `<label htmlFor>`);
- `error` (mensagem abaixo, troca borda para vermelha);
- `leftIcon` (ícone interno absoluto à esquerda);
- `labelAction` (slot à direita do label, ex.: "Esqueci minha senha").

**Por quê `forwardRef`**: para que bibliotecas de formulário (React Hook Form, etc.) e refs imperativas (`.focus()`) funcionem sem hack. O `displayName` está definido para o DevTools mostrar o nome certo.

**Por quê `label?.toLowerCase().replace(/\s+/g, "-")` como fallback de id**: gerar um id determinístico a partir do label quando o consumidor não passa `id` evita warnings de acessibilidade e mantém o `htmlFor` funcionando.

### 5.6. Componente `Logo` — modo compacto

`src/components/ui/Logo.tsx` aceita `compact?: boolean`. Quando true, renderiza apenas o favicon (asterisco da marca); false, o logotipo completo.

**Por quê**: a NavBar lateral colapsa de 256px para 80px. O logo precisa adaptar — em modo compacto, a marca aparece como ícone; em modo expandido, com wordmark.

### 5.7. `useToast` — hook próprio em vez de lib externa

`src/components/ui/UseToast.tsx` implementa toasts (loading / success / error) sem `react-toastify`, `sonner`, etc.

**Por quê**: o caso de uso é simples (4 tipos, fila empilhada no canto, auto-dismiss com timer). Adicionar uma lib de 30kB+ para isso seria desproporcional. O hook expõe `loading()`, `success()`, `error()` e `update(id, ...)` para o padrão típico "loading → resolve para success/error".

### 5.8. `usePermission` — capability-based (não role-based) no frontend

```ts
export type Capability = "dashboard.view" | "clientes.read" | "clientes.view360" | ...
```

Em vez de espalhar `if (role === "gerente_comercial" || role === "admin")` pela UI, o hook expõe `can("clientes.view360")`. A matriz role → capabilities fica isolada em `usePermission.ts`.

**Por quê**: capabilities têm granularidade fina e estável. Se amanhã uma nova role precisar ver a 360, basta adicionar `"clientes.view360"` no array da role — nenhum componente muda. Espalhar role pela UI cria dezenas de pontos de mudança.

### 5.9. `cn()` — `clsx` + `tailwind-merge`

`src/utils/cn.ts`:

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Por quê dois utilitários**:
- `clsx` resolve concatenação condicional (`cn("base", isActive && "bg-blue-500")`);
- `tailwind-merge` resolve conflitos entre classes Tailwind (`cn("p-2", "p-4")` vira `"p-4"`, não `"p-2 p-4"`).

Isso é essencial para componentes com variantes: o `Button` define `"bg-success"` no `filledByIntent.success`, e o consumidor pode passar `className="bg-primary"` para sobrescrever — `tailwind-merge` garante que a última vence.

### 5.10. Roteamento com guards aninhados

`src/router/index.tsx` usa três níveis:

1. **`ProtectedRoute`** — exige usuário autenticado, senão redireciona para `/login`.
2. **`App`** (layout shell) — envolve as rotas internas com `NavBar` + área de conteúdo.
3. **`RequireCapability`** — exige uma capacidade específica, senão redireciona para `/`.

Adicionalmente, `HomeOrFallback` resolve o caso "usuário logado mas sem permissão pro dashboard": tenta `dashboard.view`, senão escolhe a primeira rota acessível na ordem definida em `FALLBACK_ROUTES`.

**Por quê esse desenho**: separa três preocupações que costumam virar `if` aninhado em um `<App>` monolítico — autenticação, layout e autorização ficam cada uma no seu lugar. O `HomeOrFallback` evita o anti-padrão "usuário cai numa página em branco porque a home dele depende de uma permissão que ele não tem".

### 5.11. `localStorage` para token JWT e estado da sidebar

- Token: `localStorage.setItem("token", access_token)` no login, lido no `apiFetch` para o header `Authorization`.
- Sidebar: `localStorage.setItem("sidebar-collapsed", true/false)` para persistir a preferência entre sessões.

**Por quê localStorage e não cookie**: o backend não usa cookies (auth puramente via header `Bearer`), então não há benefício de `HttpOnly cookie` (que não pode ser lido por JS de qualquer forma). Mantém o front simples e mensurável.

**Trade-off conhecido**: localStorage é vulnerável a XSS. Como mitigação, o React escapa por padrão o que renderiza, não há `dangerouslySetInnerHTML`, e o CSP do Vite em produção bloqueia scripts inline.

### 5.12. `apiFetch` como única porta de saída HTTP

Todo o frontend chama o backend exclusivamente por `apiFetch` em `src/services/index.ts`:

```ts
const data = await apiFetch<UserResponse>("/auth/me")
```

**Por quê uma única função**:
- Injeção automática do header `Authorization`;
- Tratamento uniforme de erro (extrai `detail` do JSON de resposta);
- Base URL configurável via `VITE_API_URL` (Docker injeta `http://localhost:8000`);
- Genérico em `<T>` para tipagem segura sem `as`.

### 5.13. `AuthContext` orquestra o ciclo de vida da sessão

`src/context/AuthContext.tsx` mantém `user`, `isAuthenticated`, `isLoading`, `login`, `register`, `logout`.

**Por quê context (não Redux/Zustand)**: a sessão é um estado *global* mas muda raramente (login, logout, refresh). Context resolve sem lib extra.

Detalhe: o `AuthProvider` chama `/auth/me` no startup se houver token no localStorage — assim o usuário não cai no login depois de F5.

### 5.14. Recharts para gráficos do dashboard

O `Home.tsx` (dashboard) usa `AreaChart`, `BarChart`, `PieChart` do `recharts`. Tooltip customizado, paleta de cores fixa, legendas próprias.

**Por quê Recharts**: API declarativa em React (não imperativa como D3 puro), suporta `ResponsiveContainer` (gráfico se adapta ao espaço), bundle aceitável, comunidade grande. Suficiente para os gráficos do CRM sem precisar descer ao D3 manual.

### 5.15. TypeScript estrito

`tsconfig.app.json` ativa:
- `noUnusedLocals` / `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `verbatimModuleSyntax` (impõe `import type` para tipos)
- `erasableSyntaxOnly` (não permite sintaxe TS que vira código em runtime)

**Por quê**: empurra erros para o build em vez de descobrir em produção. `erasableSyntaxOnly` é especialmente importante porque o Vite usa `esbuild` para transpilar, e esbuild não suporta tudo do TS — essa flag garante compatibilidade.

---

## 6. Decisões de Docker e ambiente

### 6.1. Imagens base — `python:3.11-slim` e `node:20-alpine`

| Container | Base | Por quê |
|---|---|---|
| Backend | `python:3.11-slim` | Versão estável LTS-ish do Python, imagem mínima Debian (~50MB) com `apt` para `build-essential` |
| Frontend | `node:20-alpine` | Node 20 LTS, base Alpine (~40MB) — Vite e npm rodam bem sem dependências glibc |

### 6.2. Camadas otimizadas — `COPY requirements.txt` antes do código

No `backend/Dockerfile`:

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

**Por quê**: as dependências mudam raramente; o código muda a cada commit. Copiando `requirements.txt` antes, o cache de camada do Docker só invalida o `pip install` quando o arquivo de deps muda — builds incrementais em segundos.

Mesma técnica no `frontend/Dockerfile` com `package*.json`.

### 6.3. Volumes anônimos para isolar `venv` e `node_modules`

```yaml
volumes:
  - ./backend:/app
  - /app/venv          # anônimo
  - ./frontend:/app
  - /app/node_modules  # anônimo
```

**Por quê**: o primeiro volume sobrescreve `/app` com o código local — sem o segundo, o `venv` ou `node_modules` do **host** (compilado para Windows) sobrescreveria o que o container instalou (Linux). O volume anônimo "protege" essas pastas dentro do container.

### 6.4. `.dockerignore` em ambos os contextos

`backend/.dockerignore` exclui `venv/`, `__pycache__`, `.git`, `*.db`, etc.
`frontend/.dockerignore` exclui `node_modules`, `dist`, `.git`, etc.

**Por quê**: o `COPY . .` final copia o contexto inteiro para a imagem. Sem `.dockerignore`, levaria o `venv` (centenas de MB) e o `node_modules` (idem) para dentro da imagem só para serem ignorados pelos volumes. `.dockerignore` mantém imagens enxutas e builds rápidos.

### 6.5. `GOLD_DB_PATH` injetado por env no Compose

O Compose injeta:

```yaml
environment:
  - GOLD_DB_PATH=/app/bd/app_gold.db
```

**Por quê**: o agente IA (em `chat_service.py`) abre o SQLite Gold com caminho absoluto. Como o container tem `/app` como WORKDIR (não a estrutura local da máquina), o caminho precisa ser absoluto no container. A env var permite que esse mesmo código rode sem Docker apontando para o arquivo local.

### 6.6. Sem chave `version:` no `docker-compose.yml`

A chave `version:` (ex.: `version: "3.8"`) **foi removida**. Compose v2 ignora e emite warning toda execução; Compose v1 está descontinuado desde junho/2023.

**Por quê remover e não manter por compatibilidade**: o "custo" de manter é warning poluente em toda execução para todo o grupo. O "ganho" é compatibilidade com uma versão que a própria Docker removeu há quase 3 anos. Não compensa.

---

## 7. Fallback: rodando sem Docker

Mantido para situações pontuais (debug profundo de uma dependência, IDE que não fala bem com containers, etc.). **Não é o caminho recomendado** — todo o resto do time roda via Docker.

### 7.1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # Linux/macOS
pip install -r requirements.txt
cp .env.example .env             # ajuste suas chaves
python bd/seed.py
uvicorn main:app --reload
```

API em http://localhost:8000.

### 7.2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

App em http://localhost:5173.

### 7.3. Scripts de integração com Databricks

Funcionam tanto via container quanto local:

```bash
# Via Docker (recomendado)
docker compose exec backend python bd/upload_to_databricks.py
docker compose exec backend python bd/download_from_databricks.py

# Local (sem Docker)
cd backend && venv\Scripts\activate
python bd/upload_to_databricks.py
python bd/download_from_databricks.py
```

Pré-requisito: `DATABRICKS_HOST` e `DATABRICKS_TOKEN` configurados no `backend/.env`.

---

## Onde olhar quando algo quebrar

| Sintoma | Onde investigar |
|---|---|
| Frontend abre mas chamadas dão 401 | Token expirou (1h). Faça logout/login. Verifique se `localStorage["token"]` existe. |
| Frontend abre mas chamadas dão 403 | Sua role não tem a capability. Cheque `usePermission.ts` × `dependencies.py`. |
| Frontend abre branco | Cheque logs do container `frontend` (`docker compose logs -f frontend`). Provável erro de import. |
| Backend não sobe | Cheque logs do container `backend`. Provável: `.env` faltando ou SQLite corrompido. |
| Agente IA responde "Erro 429" | Cota gratuita da Gemini estourada. Aguardar reset (RPM = minutos, RPD = 24h). |
| Agente IA responde "Erro 503" | Sobrecarga momentânea do Gemini no lado do Google. Tentar de novo em segundos. |
| `docker compose up` warning de `version` obsoleto | Já removido. Faça `git pull`. |

---
