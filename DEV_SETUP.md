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
# Executa as migrações do Alembic para estruturar o banco de dados (SQLite)
alembic upgrade head

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

