# Stack OverGol — VCommerce CRM360

> Plataforma de CRM analítico e-commerce com pipeline de dados em Arquitetura Medalhão, API REST em FastAPI e agente de IA integrado.

---

## 📁 Arquitetura do Projeto

```
📦 projeto/
├── 📁 backend/
│   ├── 📁 app/
│   │   ├── 📁 models/
│   │   │   ├── __init__.py
│   │   │   ├── avaliacao.py
│   │   │   ├── cliente_360.py
│   │   │   ├── cliente_gold.py
│   │   │   ├── cliente.py
│   │   │   ├── pedido.py
│   │   │   ├── produto_360.py
│   │   │   ├── produto_gold.py
│   │   │   ├── produto.py
│   │   │   ├── suporte.py
│   │   │   ├── usuario.py
│   │   │   └── vendas_periodo.py
│   │   ├── 📁 routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── cliente.py
│   │   │   ├── dashboard.py
│   │   │   ├── export.py
│   │   │   ├── pedido.py
│   │   │   ├── produto.py
│   │   │   └── suporte.py
│   │   ├── 📁 schemas/
│   │   │   ├── __init__.py
│   │   │   ├── cliente.py
│   │   │   ├── dashboard.py
│   │   │   ├── pedido.py
│   │   │   ├── produto.py
│   │   │   ├── suporte.py
│   │   │   └── usuario.py
│   │   └── 📁 services/
│   │       ├── __init__.py
│   │       ├── auth_service.py
│   │       ├── chat_service.py
│   │       ├── cliente_service.py
│   │       ├── dashboard_service.py
│   │       ├── pedido_service.py
│   │       ├── produto_service.py
│   │       └── suporte_service.py
│   ├── 📁 bd/
│   │   ├── 📁 alembic/
│   │   ├── app_gold.db
│   │   ├── app_silver.db
│   │   ├── database.py
│   │   └── seed.py
│   ├── 📁 data/
│   │   ├── 📁 gold/
│   │   │   ├── dim_cliente.csv
│   │   │   ├── dim_produto.csv
│   │   │   ├── dm_cliente_360.csv
│   │   │   ├── dm_produto_360.csv
│   │   │   └── dm_vendas_periodo.csv
│   │   └── 📁 silver/
│   │       ├── silver_avaliacoes.csv
│   │       ├── silver_catalogo_produtos.csv
│   │       ├── silver_clickstream.csv
│   │       ├── silver_clientes_dispositivo.csv
│   │       ├── silver_clientes.csv
│   │       ├── silver_pedidos.csv
│   │       └── silver_suporte_tickets.csv
│   ├── 📁 tests/
│   ├── .env.example
│   ├── alembic.ini
│   ├── main.py
│   └── requirements.txt
├── 📁 data-engineering/
│   ├── Bronze-Silver.ipynb
│   ├── Landing-Bronze.ipynb
│   ├── Silver-Gold.ipynb
│   └── Stack_OverGol.yaml
├── 📁 frontend/
│   └── 📁 src/
│       ├── 📁 components/
│       ├── 📁 context/
│       ├── 📁 hooks/
│       ├── 📁 pages/
│       ├── 📁 router/
│       ├── 📁 services/
│       ├── 📁 types/
│       └── 📁 utils/
├── DEV_SETUP.md
└── README.md
```

---

## 📊 Arquitetura e Fluxo de Dados

A documentação completa e detalhada do fluxo de engenharia de dados (incluindo tratamento de colunas, modelagem e decisões técnicas) está disponível em formato de arquivo pdf no repositório [Documentação Fluxo de Dados](https://github.com/CaioLira18/projeto-final-rocketlab-grupo-1/blob/90809d76200dff698bc9b25e354883304463a485/Documenta%C3%A7%C3%A3o%20Fluxo%20de%20Dados.pdf).

O pipeline foi construído seguindo a **Arquitetura Medalhão**, garantindo governança, qualidade e alta performance no processamento analítico:

---

### 📥 Origem (Landing)

Ingestão de dados transacionais, cadastrais e logs de navegação em formato bruto (`.csv`).

<img width="1919" height="907" alt="Camada Landing" src="https://github.com/user-attachments/assets/f7531f0c-c595-41ab-8547-7e63a499985e" />

---

### 🥉 Camada Bronze

Leitura automatizada via Spark e persistência do dado no formato Delta Table sem alterações morfológicas, garantindo o histórico exato da fonte.

<img width="1919" height="910" alt="Camada Bronze" src="https://github.com/user-attachments/assets/54a37788-b7cd-49ae-a862-1fc17406d7a0" />

---

### 🥈 Camada Silver

Fase de purificação estrutural. Aplicamos regras de limpeza, padronização de strings, Regex, conversões de timestamps, limites lógicos, tratamento de nulos e desmembramento de IDs.

<img width="1919" height="912" alt="Camada Silver" src="https://github.com/user-attachments/assets/b3e1eae4-bf19-4d6d-a867-0fc942106c8e" />

---

### 🥇 Camada Gold

Modelagem voltada ao negócio (Star Schema). Foram criadas tabelas de Dimensão (Cliente, Produto) e tabelas Fato (Vendas, Suporte, Avaliações, Eventos). O destaque é a tabela `fato_360_cliente`, que agrega KPIs como LTV, recência, NPS e tickets em uma visão unificada.

<img width="1917" height="911" alt="Camada Gold" src="https://github.com/user-attachments/assets/35f5af1f-611f-44a2-909f-9b04a15691b7" />

---

### 🚀 Entrega e Orquestração

A etapa final exporta os dados modelados para um banco SQLite local, entregando altíssima portabilidade e experiência zero-setup (serverless). Tudo é orquestrado por uma DAG robusta com dependências seguras que roda diariamente à meia-noite.

<img width="1333" height="667" alt="Orquestração Airflow" src="https://github.com/user-attachments/assets/80ff4968-543e-48e5-9ef0-49a4f0c583ef" />

---

## 🔌 API — Endpoints

A API é construída com **FastAPI** e organizada em módulos por domínio. Todas as rotas (exceto `/auth/register` e `/auth/login`) requerem autenticação via **Bearer Token JWT**.

Base URL: `http://localhost:8000`

---

### 🔐 Autenticação — `/auth`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/auth/register` | Cadastra um novo usuário | ❌ |
| `POST` | `/auth/login` | Realiza login e retorna o token JWT | ❌ |
| `GET` | `/auth/me` | Retorna os dados do usuário autenticado | ✅ |

**Exemplo de login:**
```json
POST /auth/login
{
  "email": "usuario@exemplo.com",
  "password": "suasenha"
}
```
**Resposta:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### 👤 Clientes — `/clientes`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/clientes/` | Lista clientes com filtros e paginação |
| `GET` | `/clientes/{cliente_id}` | Busca um cliente pelo ID |
| `GET` | `/clientes/{cliente_id}/historico` | Retorna o histórico de um cliente |
| `GET` | `/clientes/360/{cliente_id}` | Visão 360° do cliente (banco Gold) |

**Parâmetros de filtro disponíveis em `GET /clientes/`:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id_cliente` | string | Busca parcial por ID |
| `nome` / `sobrenome` | string | Filtro por nome |
| `email` | string | Filtro por e-mail |
| `cidade` / `estado` / `pais` | string/lista | Filtro geográfico |
| `genero` | lista | Filtro por gênero |
| `origem` | lista | Canal de origem do cliente |
| `idade_min` / `idade_max` | int | Faixa etária |
| `ramal` / `sem_ramal` | string/bool | Filtro por ramal |
| `busca` | string | Busca geral (nome, sobrenome, email) |
| `ano_cadastro` | lista int | Filtra pelo ano de cadastro |
| `skip` / `limit` | int | Paginação (padrão: 0 / 50, máx: 500) |

---

### 📦 Pedidos — `/pedidos`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/pedidos/` | Lista pedidos com filtros e paginação |
| `GET` | `/pedidos/count` | Contagem de pedidos agrupada por status |

**Parâmetros de filtro disponíveis em `GET /pedidos/`:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id_pedido` / `id_cliente` / `id_produto` | string | Busca por ID |
| `nome_cliente` / `nome_produto` | string | Busca por nome |
| `data_inicio` / `data_fim` | date | Intervalo de datas |
| `valor_min` / `valor_max` | float | Faixa de valor |
| `status` | string | Status do pedido |
| `metodo_pagamento` | string | Método de pagamento |
| `categoria_produto` | string | Categoria do produto |
| `estado` / `cidade` | string | Localização do cliente |
| `order_by` | enum | Campo de ordenação |
| `order_dir` | `asc` / `desc` | Direção da ordenação |
| `skip` / `limite` | int | Paginação (padrão: 0 / 50) |

---

### 🛍️ Produtos — `/produtos`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/produtos/` | Lista básica de produtos |
| `GET` | `/produtos/{produto_id}` | Busca produto pelo ID |
| `POST` | `/produtos/` | Adiciona um novo produto |
| `PUT` | `/produtos/{produto_id}` | Edita um produto existente |
| `DELETE` | `/produtos/{produto_id}` | Remove um produto |
| `GET` | `/produtos/metricas` | Lista métricas completas de todos os produtos (banco Gold) |
| `GET` | `/produtos/metricas/{produto_id}` | Métricas completas de um produto específico |

**Parâmetros de filtro em `GET /produtos/metricas`:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `categoria` | string | Filtrar por categoria |
| `faixa_preco` | `baixo` / `medio` / `alto` | Filtrar por faixa de preço |
| `produto_ativo` | bool | Filtrar ativos/inativos |
| `busca` | string | Busca por nome, ID ou fornecedor |
| `skip` / `limit` | int | Paginação (padrão: 0 / 50) |

---

### 🎧 Suporte — `/suporte`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/suporte/resumo` | Resumo geral dos tickets (total, abertos, resolvidos, tempo médio) |
| `GET` | `/suporte/tickets` | Lista de tickets com filtros e paginação |
| `GET` | `/suporte/tickets/{ticket_id}` | Busca um ticket pelo ID |
| `GET` | `/suporte/metricas/{produto_id}` | Métricas de suporte de um produto |

**Parâmetros de filtro em `GET /suporte/tickets`:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id_produto` / `id_cliente` | string | Filtrar por produto ou cliente |
| `tipo_problema` | string | Tipo de problema relatado |
| `nome_cliente` | string | Nome do cliente |
| `agente_suporte` | string | Agente responsável |
| `status` | `aberto` / `resolvido` | Status do ticket |
| `data_inicio` / `data_fim` | datetime | Intervalo de abertura |
| `skip` / `limit` | int | Paginação (padrão: 0 / 50, máx: 500) |

> O total de registros é retornado no header `X-Total-Count`.

---

### 📈 Dashboard — `/dashboard`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/dashboard/kpis` | Retorna os principais KPIs de Vendas e Clientes |

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `sync` | bool | `true` força o recálculo, ignorando o cache (padrão: `false`) |

---

### 🤖 Agente IA — `/chat`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/chat` | Envia mensagem ao agente e recebe resposta |
| `GET` | `/chat/suggestions` | Lista perguntas sugeridas para a tela inicial |
| `DELETE` | `/chat/session/{session_id}` | Limpa o histórico de uma sessão |

**Exemplo de requisição:**
```json
POST /chat
{
  "session_id": "abc123",
  "message": "Quais são os produtos com mais tickets de suporte?"
}
```

O histórico de conversa é mantido em memória por `session_id`, permitindo contexto contínuo dentro da sessão.

---

### 📤 Exportação — `/export`

| Método | Endpoint | Arquivo gerado |
|--------|----------|----------------|
| `GET` | `/export/clientes` | `clientes.csv` |
| `GET` | `/export/pedidos` | `pedidos.csv` |
| `GET` | `/export/produtos` | `produtos.csv` |
| `GET` | `/export/suporte` | `suporte.csv` |
| `GET` | `/export/avaliacoes` | `avaliacoes.csv` |

Todos os endpoints de exportação retornam um arquivo CSV via download (`Content-Disposition: attachment`).

---

## 🗄️ Bancos de Dados

O projeto utiliza dois bancos SQLite:

| Banco | Arquivo | Uso |
|-------|---------|-----|
| **Silver** | `app_silver.db` | Dados operacionais: clientes, pedidos, produtos, suporte, avaliações |
| **Gold** | `app_gold.db` | Dados analíticos pré-calculados: dimensões, fatos, visões 360° |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Backend | Python · FastAPI · SQLAlchemy · PyJWT |
| Banco de dados | SQLite (Silver + Gold) · Alembic (migrações) |
| Engenharia de dados | Apache Spark · Delta Lake · Apache Airflow |
| Agente IA | PydanticAI · Gemini API |
| Frontend | React · TypeScript · Vite |

---

## 🚀 Como rodar

```bash
# 1. Clonar o repositório e entrar na pasta do backend
cd backend

# 2. Criar e ativar o ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves (SECRET_KEY, GEMINI_API_KEY, etc.)

# 5. Popular o banco de dados
python bd/seed.py

# 6. Subir a API
uvicorn main:app --reload
```

Acesse a documentação interativa em: **http://localhost:8000/docs**

---

## 👥 Membros do Grupo

| Nome | GitHub |
|------|--------|
| André Castro | [@andrecastrom06](https://github.com/andrecastrom06) |
| Caio Ferreira | [@CaioLira18](https://github.com/CaioLira18) |

---

## 🔗 Links Úteis

- [📄 Documentação Completa — Fluxo de Dados](https://docs.google.com/document/d/18yvL57PG_jbHkyGUdaTNTt7RniZP6ozEwQV4HjiGE98/edit?usp=sharing)
- [📁 Google Drive do Projeto](https://drive.google.com/drive/folders/1Xl3bOmaR3oNsEva4D6Q_mMzl0KPIyVu6?usp=sharing)
