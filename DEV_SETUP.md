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

Navegue para o diretório de backend, ative o ambiente virtual e execute o servidor uvicorn:

```bash
cd backend
python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

Crie o arquivo `.env` a partir do exemplo:
```bash
cp .env.example .env
```

**4. Configuração do Banco de Dados (Alembic + Seed)**

Para que a API funcione, você precisa criar o banco de dados e popular com as tabelas geradas pela Engenharia de Dados (CSVs da camada Silver).
Garanta que os 7 arquivos CSVs (`silver_clientes.csv`, etc) estejam na pasta `backend/seed_data/`. Em seguida, execute:

```bash
# Aplique a migração para criar as tabelas no SQLite
alembic upgrade head

# Rode o script de seed para popular o banco com os dados dos CSVs (Pandas)
python seed.py
```

**5. Rode o servidor de desenvolvimento**

```bash
uvicorn main:app --reload --port 8080
```

A API estará rodando em: `http://localhost:8080`
Você pode acessar a documentação auto-gerada do backend pelo Swagger em: `http://localhost:8080/docs`

### 2. Inicializando o Frontend (React/Vite)

Em um terminal secundário, navegue para o diretório frontend e inicie o Vite:

```bash
cd frontend
npm install
npm run dev
```
O frontend estará rodando e sincronizado (HMR) localmente. Normalmente disponível em: `http://localhost:5173`.

---

