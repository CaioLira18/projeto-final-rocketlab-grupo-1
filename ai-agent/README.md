# 🤖 Analista de Dados CRM - Chatbot IA

Um chatbot inteligente especializado em análise de dados de CRM usando inteligência artificial (GPT-4o) para fornecer insights estratégicos sobre saúde financeira, LTV, ticket médio, churn e muito mais.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Ferramentas Disponíveis](#ferramentas-disponíveis)
- [Exemplos de Perguntas](#exemplos-de-perguntas)

## ✨ Funcionalidades

### 📊 Análises Disponíveis

#### Saúde Financeira Geral
- Receita total e ticket médio
- LTV (Lifetime Value) médio
- Taxas de entrega e cancelamento
- Distribuição de pedidos por status

#### Análise de Clientes
- LTV por cliente (Lifetime Value)
- Segmentação por valor (VIP, Premium, Regular, Dormentes)
- Clientes em risco de churn
- Novos clientes (últimos N dias)
- Distribuição por localização (cidade, estado, país)
- Comportamento por origem (Organic, Ads, Referral, etc)

#### Análise de Vendas
- Receita por categoria de produto
- Métodos de pagamento populares
- Vendas por estado
- Comparação de períodos
- Produtos mais/menos vendidos
- Ticket médio por período

#### Satisfação e Suporte
- NPS (Net Promoter Score) médio
- Análise de tickets de suporte
- Tempo médio de resolução
- Satisfação por cliente

#### Engajamento
- Métricas de engajamento digital
- Sessões e eventos
- Tempo em página

## 🔧 Requisitos

- Python 3.8+
- SQLite (banco de dados `stack_overgol`)
- API Key do OpenRouter com acesso a GPT-4o

## 📦 Instalação

### 1. Clone o repositório e navegue até a pasta

```bash
cd ai-agent
```

### 2. Crie um ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

## ⚙️ Configuração

### 1. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto `ai-agent`:

```env
API_KEY=sua_chave_api_openrouter_aqui
```

**Como obter sua API Key:**
1. Acesse [OpenRouter.ai](https://openrouter.ai)
2. Faça login ou crie uma conta
3. Gere uma nova API Key
4. Copie e cole no arquivo `.env`

### 2. Verifique o caminho do banco de dados

Certifique-se de que o arquivo `stack_overgol` (banco SQLite) está acessível. Se não estiver no mesmo diretório do `ai-agent`, atualize o caminho em `tools.py`:

```python
DB_PATH = 'caminho/para/seu/stack_overgol'  # Atualize se necessário
```

## 🚀 Como Usar

### Executar o chatbot

```bash
python chatbot.py
```

Você verá uma interface interativa:

```
======================================================================
🔍 SISTEMA DE ANÁLISE DE DADOS - ANALISTA CRM STACK OVERGOL
======================================================================

📊 Bem-vindo! Sou seu assistente de análise de dados.
Posso ajudar com: LTV, Ticket Médio, Churn, Segmentação, NPS e muito mais!
Digite 'sair' para encerrar.

👤 Qual sua dúvida sobre o negócio?
```

### Digite sua pergunta

O sistema processará sua pergunta e fornecerá uma análise completa com:
1. **Resumo Executivo** - Resposta direta
2. **Dados Principais** - Números brutos
3. **Análise Contextual** - Interpretação
4. **Recomendações** - Ações sugeridas
5. **Próximos Passos** - Análises complementares

## 🛠️ Ferramentas Disponíveis

O chatbot acessa automaticamente essas ferramentas:

### Saúde Financeira
- `get_saude_financeira_geral()` - Visão geral de métricas chave
- `get_ltv_por_cliente()` - LTV para cada cliente
- `get_ticket_medio_por_periodo()` - Evolução do ticket médio

### Clientes
- `get_clientes_por_localizacao()` - Busca por cidade/estado/país
- `get_distribuicao_clientes_por_localizacao()` - Distribuição geográfica
- `get_segmentacao_clientes_por_valor()` - Segmentação VIP/Premium/Regular
- `get_clientes_com_maior_ltv()` - Top clientes por receita
- `get_clientes_em_risco_churn()` - Monitoramento de churn
- `get_novos_clientes()` - Clientes novos em período

### Vendas
- `get_receita_por_categoria()` - Performance por categoria
- `get_metodos_pagamento_populares()` - Métodos de pagamento
- `get_status_pedidos_distribuicao()` - Status dos pedidos
- `get_vendas_por_estado()` - Desempenho regional
- `get_produtos_mais_vendidos()` - Top produtos
- `get_produtos_menos_vendidos()` - Produtos com baixo volume

### Satisfação
- `get_nps_media()` - Net Promoter Score
- `get_satisfacao_por_cliente()` - Satisfação por cliente
- `get_analise_tickets_suporte()` - Análise de suporte

### Engajamento
- `get_engajamento_digital()` - Métricas digitais
- `get_comportamento_compra_por_origem()` - Análise por canal

## 💡 Exemplos de Perguntas

### Saúde Financeira
```
"Qual é a saúde financeira geral da empresa?"
"Qual foi o ticket médio do último mês?"
"Qual é o LTV médio dos meus clientes?"
```

### Análise de Clientes
```
"Quem são meus clientes VIP?"
"Quantos clientes estão em risco de churn?"
"Quais são os clientes com maior LTV?"
"Qual é a distribuição de clientes por estado?"
```

### Vendas
```
"Qual categoria tem maior receita?"
"Qual é o método de pagamento mais usado?"
"Como evoluiu a receita nos últimos meses?"
"Quais produtos são tendência?"
```

### Satisfação
```
"Qual é meu NPS?"
"Como está o tempo de resolução de suporte?"
"Qual é a taxa de satisfação dos clientes?"
```

## 📈 Dicas de Uso

1. **Seja específico**: Em vez de "Análise geral", tente "Qual é o LTV dos meus clientes premium?"
2. **Forneça contexto**: Perguntas com mais detalhes geram respostas melhores
3. **Faça comparações**: O sistema pode comparar períodos, regiões, segmentos
4. **Peça recomendações**: Além de dados, peça sugestões de ação

## 🔄 Fluxo de Funcionamento

```
Pergunta do Usuário
        ↓
    [GPT-4o]
        ↓
    Seleciona Ferramentas
        ↓
    [Python] Executa Queries SQL
        ↓
    Banco SQLite (stack_overgol)
        ↓
    Resultados em JSON
        ↓
    [GPT-4o] Analisa e Interpreta
        ↓
    Resposta Estruturada
        ↓
    Usuário
```

## 🐛 Troubleshooting

### Erro: "API_KEY não configurada"
- Verifique se o arquivo `.env` existe
- Verifique a API Key do OpenRouter
- Reinicie o chatbot

### Erro: "Banco de dados não encontrado"
- Verifique o caminho `DB_PATH` em `tools.py`
- Certifique-se que `stack_overgol` existe

### Requisição timeou
- Aumente o timeout em `chatbot.py` (linha com `timeout=30`)
- Verifique sua conexão com internet

## 📝 Estrutura do Projeto

```
ai-agent/
├── chatbot.py           # Aplicação principal (loop de chat)
├── tools.py             # Funções de análise de dados
├── requirements.txt     # Dependências Python
├── .env                 # Variáveis de ambiente (NÃO commitar)
├── .env.example         # Exemplo de configuração
└── README.md            # Este arquivo
```

## 🔐 Segurança

- **API Key**: Nunca compartilhe sua API Key
- **Banco de dados**: O caminho é local e não é exposto
- **Dados**: Nenhum dado é armazenado nos servidores da IA
- `.env` deve estar em `.gitignore`

## 📞 Suporte

Para questões sobre:
- **Funcionalidades**: Verifique [Ferramentas Disponíveis](#ferramentas-disponíveis)
- **Uso**: Veja [Exemplos de Perguntas](#exemplos-de-perguntas)
- **Erros**: Consulte [Troubleshooting](#troubleshooting)

## 📄 Licença

Projeto desenvolvido para análise de CRM com Stack Overgol.

---

**Desenvolvido com ❤️ para análise de dados inteligente**
