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
# 1. Acesse a pasta do backend
cd backend

# 2. Ative o ambiente virtual
# No Linux/macOS:
source venv/bin/activate
# No Windows (PowerShell):
# .\venv\Scripts\Activate

# 3. Rode o servidor de desenvolvimento
uvicorn main:app --reload
```
A API estará rodando em: `http://localhost:8000`
Você pode acessar a documentação auto-gerada do backend pelo Swagger em: `http://localhost:8000/docs`

### 2. Inicializando o Frontend (React/Vite)

Em um terminal secundário, navegue para o diretório frontend e inicie o Vite:

```bash
# 1. Acesse a pasta do frontend
cd frontend

# 2. Rode o servidor de desenvolvimento Vite
npm run dev
```
O frontend estará rodando e sincronizado (HMR) localmente. Normalmente disponível em: `http://localhost:5173`.

---

## 🛡 Padrões de Código e Boas Práticas
- **Commits:** Certifique-se de que nenhum dado sensível (`.env` ou `app.db`) suba no versionamento; ambos já estão configurados no `.gitignore`.
- **Backend:**
  - Utilize o `schemas.py` para padronizar e validar dados de entrada/saída através do Pydantic.
  - Utilize o `routers/` para agrupar domínios da aplicação (exemplo: rotas para o módulo 'users' devem viver em `routers/users.py`).
- **Frontend:**
  - Todas as funções e componentes devem ser rigorosamente tipados em TypeScript.

> O Banco de Dados SQLite (`.db`) está configurado apenas estruturalmente via SQLAlchemy para que vocês insiram o volume de dados quando corrigirem as dependências de engenharia de dados/ETL.
