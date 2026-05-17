# Configuração de Ambiente de Desenvolvimento (Dev Setup)

Este documento detalha a arquitetura do projeto web e fornece instruções sobre como rodar e contribuir com o ambiente de desenvolvimento.

## 🏗 Arquitetura do Projeto

A stack do projeto é composta pelas seguintes tecnologias e foi desenhada sob um padrão de mercado focado em escalabilidade e manutenção:

- **Frontend:** React + TypeScript (Scaffoldado com Vite para alta performance no build)
- **Backend:** Python + FastAPI (Alta performance, auto-documentação Swagger/ReDoc)
- **Banco de Dados:** SQLite (Com SQLAlchemy como ORM para mapeamento e fácil migração para PostgreSQL caso necessário no futuro)

### 📂 Estrutura de Diretórios

```
projeto-final-rocketlab-grupo-1/
├── frontend/                 # Aplicação React + TypeScript (Vite)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # Aplicação FastAPI (Python)
│   ├── routers/              # Separação das rotas (Endpoints modulares)
│   ├── main.py               # Entry point do FastAPI (Configurações de CORS, etc)
│   ├── database.py           # Configuração de conexão ao SQLite e Engine
│   ├── models.py             # Modelos de dados do SQLAlchemy (Tabelas do Banco)
│   ├── schemas.py            # Validações com Pydantic (Input/Output dos endpoints)
│   ├── requirements.txt      # Dependências Python
│   └── venv/                 # Virtual Environment Python
├── .gitignore                # Ignora arquivos compilados, senhas e módulos pesados
├── DEV_SETUP.md              # Este arquivo
└── README.md                 # Documentação Principal e Fluxo de Engenharia de Dados
```

---

## 💻 Como Rodar o Projeto Localmente

### 1. Inicializando o Backend (FastAPI)

Navegue para o diretório de backend, ative o ambiente virtual, crie as tabelas com o Alembic, popule-as com o seed e execute o servidor uvicorn:

```bash
# 1. Acesse a pasta do backend
cd backend

# 2. Ative o ambiente virtual
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente (Linux/macOS)
source venv/bin/activate

# Ativar ambiente (Windows)
venv\Scripts\activate

# 3. Instale as dependências
pip install -r requirements.txt
```

Crie o arquivo `.env` a partir do exemplo:
```bash
cp .env.example .env
```

#### 🗄️ 4. Banco de Dados e Migrações (Alembic)
Com o ambiente ativado e as dependências instaladas, crie a estrutura do banco e popule os dados a partir dos arquivos CSV locais na pasta `data/`:

```bash
# Executa o script de seed para popular todas as tabelas (Dimensões e Fatos)
python bd/seed.py
```

#### 🚀 5. Inicializando o Servidor
Rode o servidor de desenvolvimento:
```bash
uvicorn main:app --reload
```

A API estará rodando em: `http://localhost:8000` (ou na porta configurada, por padrão `8000` ou `8080` dependendo das suas variáveis locais).
Você pode acessar a documentação auto-gerada do backend pelo Swagger em: `http://localhost:8000/docs`


### 2. Inicializando o Frontend (React/Vite)

Em um terminal secundário, navegue para o diretório frontend e inicie o Vite:

```bash
# 1. Acesse a pasta do frontend
cd frontend

# 2. Instale as dependências do projeto
npm install

# 3. Rode o servidor de desenvolvimento Vite
npm run dev
```
O frontend estará rodando e sincronizado (HMR) localmente. Normalmente disponível em: `http://localhost:5173`.

---

## ☁️ Integração com Databricks (Upload & Download)
Nosso backend possui uma comunicação de via de mão dupla através da API REST com o Unity Catalog do Databricks:

- **Upload (`bd/upload_to_databricks.py`)**: Extrai os dados operacionais da base transacional local (Silver) e os envia para a Landing Zone do Databricks. É lá na nuvem que ocorre o **retratamento de dados**, onde ocorrem as transformações pesadas, agregações e a modelagem do Star Schema.
- **Download (`bd/download_from_databricks.py`)**: Baixa os arquivos consolidados e processados (Camada Gold) pelo Databricks. Ele **atualiza os dados Gold e o banco de dados analítico local (`app_gold.db`)**, o que garante a performance no carregamento de nossos Dashboards.

### ⚙️ Como Configurar a Integração Databricks
1. Acesse o seu workspace do Databricks e gere um **Token de Acesso Pessoal (PAT)** (em *User Settings* > *Developer* > *Access tokens*).
2. Obtenha a **URL do Workspace** (Host), por exemplo: `https://adb-12345678.azuredatabricks.net`.
3. Navegue até o diretório `backend`, crie ou edite o arquivo `.env` (baseado no `.env.example`) e configure as variáveis principais:
   ```env
   DATABRICKS_HOST="https://adb-<seu-id>.azuredatabricks.net"
   DATABRICKS_TOKEN="dapi..."
   DATABRICKS_DEST_DIR="/Volumes/stack_overgol/default/landing/"
   DATABRICKS_GOLD_DIR="/Volumes/stack_overgol/default/gold/"
   ```
4. No seu terminal, dentro da pasta `backend` (com o ambiente virtual ativado), você pode rodar os scripts de integração manualmente:
   - Para enviar dados para o retratamento: `python bd/upload_to_databricks.py`
   - Para receber e atualizar o banco analítico (Gold): `python bd/download_from_databricks.py`

---
