# 📊 Documentação Técnica - Queries Disponíveis

Este arquivo documenta todas as funções de análise disponíveis no chatbot CRM.

## 1️⃣ Análises Gerais de Saúde Financeira

### `get_saude_financeira_geral()`

Retorna um resumo das principais métricas de saúde financeira.

**Retorno:**
```json
{
  "total_clientes": 1234,
  "total_pedidos": 5678,
  "receita_total": 123456.78,
  "ticket_medio": 21.72,
  "ltv_medio": 100.00,
  "pedidos_entregues": 5000,
  "pedidos_cancelados": 300,
  "taxa_entrega_percentual": 88.00,
  "taxa_cancelamento_percentual": 5.27
}
```

**Quando usar:** Quando o usuário quer um "overview" rápido da empresa

---

### `get_ticket_medio_por_periodo(tipo_periodo='mes')`

Calcula a evolução do ticket médio ao longo do tempo.

**Parâmetros:**
- `tipo_periodo`: 'dia', 'mes', 'trimestre' ou 'ano'

**Retorno:**
```json
[
  {
    "periodo": "2024-12",
    "total_pedidos": 250,
    "ticket_medio": 150.50,
    "receita_total": 37625.00,
    "clientes_unicos": 180
  },
  // ... mais períodos
]
```

**Quando usar:** Análise de tendências de preço médio

---

## 2️⃣ Análises de Clientes

### `get_ltv_por_cliente()`

Calcula o Lifetime Value (valor total que cada cliente gastou) para todos os clientes.

**Retorno:**
```json
[
  {
    "id_cliente": "CLI001",
    "nome_cliente": "João Silva",
    "total_pedidos": 15,
    "ltv": 3500.00,
    "ticket_medio": 233.33,
    "primeira_compra": "2022-01-15",
    "ultima_compra": "2024-12-10",
    "anos_como_cliente": 2.9
  },
  // ... mais clientes ordenados por LTV
]
```

**Quando usar:** Identificar clientes mais valiosos

---

### `get_segmentacao_clientes_por_valor()`

Segmenta clientes em 4 categorias baseado no LTV.

**Retorno:**
```json
[
  {
    "segmento": "VIP",
    "total_clientes": 123,
    "receita_media_segmento": 5000.00,
    "receita_total_segmento": 615000.00,
    "pedidos_medios": 25.5,
    "recencia_media_dias": 15.3
  },
  {
    "segmento": "Premium",
    "total_clientes": 311,
    // ...
  },
  // ... Regular e Dormentes
]
```

**Segmentos:**
- **VIP**: Top 25% (maior LTV)
- **Premium**: 25-50%
- **Regular**: 50-75%
- **Dormentes**: Bottom 25%

**Quando usar:** Estratégia de retenção diferenciada por segmento

---

### `get_clientes_com_maior_ltv(limite=10)`

Retorna os N clientes com maior LTV.

**Parâmetros:**
- `limite`: Número de clientes (padrão: 10)

**Retorno:**
```json
[
  {
    "id_cliente": "CLI001",
    "nome_completo_cliente": "João Silva",
    "ltv": 15000.00,
    "total_pedidos": 45,
    "ticket_medio_cliente": 333.33,
    "nps_medio_cliente": 9.5,
    "taxa_recomendacao_cliente": 95.0,
    "data_primeira_compra": "2020-05-20",
    "data_ultima_compra": "2024-12-15",
    "cliente_ativo_90d": true
  },
  // ... mais clientes
]
```

**Quando usar:** Identificar VIPs para programas de fidelização

---

### `get_clientes_em_risco_churn()`

Identifica clientes que não compram há muito tempo (risco de sair).

**Retorno:**
```json
[
  {
    "id_cliente": "CLI999",
    "nome_completo_cliente": "Maria Santos",
    "receita_total_cliente": 2500.00,
    "total_pedidos": 8,
    "recencia_dias": 200,
    "data_ultima_compra": "2024-06-10",
    "nivel_risco": "Risco Crítico",
    "nota_media_atendimento": 3.5,
    "nps_medio_cliente": 5.0
  },
  // ... mais clientes
]
```

**Níveis de Risco:**
- **Risco Crítico**: Sem comprar há mais de 180 dias
- **Risco Alto**: 90-180 dias
- **Risco Médio**: 30-90 dias
- **Saudável**: Menos de 30 dias

**Quando usar:** Campanhas de reativação, análise de retenção

---

### `get_novos_clientes(dias=30)`

Retorna clientes cadastrados nos últimos N dias.

**Parâmetros:**
- `dias`: Número de dias (padrão: 30)

**Retorno:**
```json
[
  {
    "id_cliente": "CLI_NEW_001",
    "nome_completo_cliente": "Pedro Costa",
    "email_cliente": "pedro@email.com",
    "cidade_cliente": "São Paulo",
    "estado_cliente": "SP",
    "data_cadastro_cliente": "2024-12-10",
    "total_pedidos": 2,
    "receita_total_cliente": 250.00,
    "ticket_medio_cliente": 125.00,
    "origem_cliente": "Organic"
  },
  // ... mais clientes novos
]
```

**Quando usar:** Análise de onboarding, efetividade de aquisição

---

### `get_clientes_por_localizacao(localizacao, tipo)`

Busca clientes em uma localização específica.

**Parâmetros:**
- `localizacao`: Nome da cidade, estado ou país
- `tipo`: 'cidade', 'estado' ou 'pais'

**Retorno:**
```json
[
  {
    "id_cliente": "CLI_SP001",
    "nome_cliente": "Ana",
    "email_cliente": "ana@email.com",
    "telefone_cliente": "+55 11 98765-4321",
    "cidade_cliente": "São Paulo",
    "estado_cliente": "SP",
    "pais_cliente": "Brasil",
    "total_pedidos": 5,
    "receita_total_cliente": 1200.00,
    "ticket_medio_cliente": 240.00,
    "data_ultima_compra": "2024-11-20",
    "cliente_ativo_90d": true
  },
  // ... mais clientes
]
```

**Quando usar:** Análise regional, expansão geográfica

---

### `get_distribuicao_clientes_por_localizacao(tipo)`

Mostra distribuição de clientes e receita por localização.

**Parâmetros:**
- `tipo`: 'cidade', 'estado' ou 'pais'

**Retorno:**
```json
[
  {
    "localizacao": "São Paulo",
    "total_clientes": 456,
    "receita_total": 125000.00,
    "receita_media": 274.12,
    "percentual_receita": 35.50
  },
  {
    "localizacao": "Rio de Janeiro",
    "total_clientes": 234,
    "receita_total": 65000.00,
    "receita_media": 277.78,
    "percentual_receita": 18.47
  },
  // ... mais localizações
]
```

**Quando usar:** Análise de mercado, concentração regional

---

## 3️⃣ Análises de Vendas e Produtos

### `get_receita_por_categoria()`

Analisa performance de receita por categoria de produto.

**Retorno:**
```json
[
  {
    "categoria_produto": "Eletrônicos",
    "total_pedidos": 450,
    "clientes_unicos": 300,
    "receita_total": 85000.00,
    "ticket_medio": 188.89,
    "taxa_entrega": 92.5
  },
  {
    "categoria_produto": "Livros",
    "total_pedidos": 320,
    "clientes_unicos": 250,
    "receita_total": 32000.00,
    "ticket_medio": 100.00,
    "taxa_entrega": 98.7
  },
  // ... mais categorias
]
```

**Quando usar:** Mix de produtos, decisões de portfólio

---

### `get_produtos_mais_vendidos(limite=20)`

Produtos com maior volume de vendas.

**Parâmetros:**
- `limite`: Número de produtos (padrão: 20)

**Retorno:**
```json
[
  {
    "nome_produto": "Notebook XYZ",
    "categoria_produto": "Eletrônicos",
    "total_vendas": 250,
    "quantidade_total": 300,
    "receita_total": 75000.00,
    "preco_medio": 300.00,
    "clientes_unicos": 180
  },
  // ... mais produtos
]
```

**Quando usar:** Identificar best-sellers, gerenciar estoque

---

### `get_metodos_pagamento_populares()`

Análise dos métodos de pagamento mais usados.

**Retorno:**
```json
[
  {
    "metodo_pagamento": "Cartão de Crédito",
    "total_pedidos": 3500,
    "receita_total": 175000.00,
    "ticket_medio": 50.00,
    "percentual_pedidos": 65.4
  },
  {
    "metodo_pagamento": "Boleto",
    "total_pedidos": 1200,
    "receita_total": 48000.00,
    "ticket_medio": 40.00,
    "percentual_pedidos": 22.4
  },
  // ... mais métodos
]
```

**Quando usar:** Otimizar opções de pagamento

---

### `get_status_pedidos_distribuicao()`

Distribuição de pedidos por status.

**Retorno:**
```json
[
  {
    "status_pedido": "Entregue",
    "total_pedidos": 5000,
    "receita": 250000.00,
    "percentual": 93.2
  },
  {
    "status_pedido": "Cancelado",
    "total_pedidos": 250,
    "receita": 0.00,
    "percentual": 4.7
  },
  {
    "status_pedido": "Pendente",
    "total_pedidos": 100,
    "receita": 5000.00,
    "percentual": 1.9
  }
]
```

**Quando usar:** Qualidade de fulfillment, gestão de operações

---

### `get_vendas_por_estado()`

Performance de vendas por estado.

**Retorno:**
```json
[
  {
    "estado_cliente": "SP",
    "total_pedidos": 2000,
    "clientes_unicos": 800,
    "receita_total": 200000.00,
    "ticket_medio": 100.00,
    "percentual_receita": 56.8
  },
  {
    "estado_cliente": "RJ",
    "total_pedidos": 800,
    "clientes_unicos": 350,
    "receita_total": 80000.00,
    "ticket_medio": 100.00,
    "percentual_receita": 22.7
  },
  // ... mais estados
]
```

**Quando usar:** Análise regional, alocação de recursos

---

### `comparar_periodos(tipo_periodo='mes')`

Compara métricas entre períodos consecutivos.

**Retorno:**
```json
[
  {
    "periodo": "2024-12",
    "total_pedidos": 500,
    "clientes_unicos": 350,
    "receita": 50000.00,
    "ticket_medio": 100.00,
    "percentual_receita_total": 15.3
  },
  {
    "periodo": "2024-11",
    "total_pedidos": 480,
    "clientes_unicos": 320,
    "receita": 48000.00,
    "ticket_medio": 100.00,
    "percentual_receita_total": 14.7
  },
  // ... períodos anteriores
]
```

**Quando usar:** Análise de crescimento, tendências

---

## 4️⃣ Análises de Satisfação e Suporte

### `get_nps_media()`

Net Promoter Score (NPS) - indicador de satisfação e lealdade.

**Retorno:**
```json
{
  "nps_medio": 52.5,
  "promotores": 600,
  "neutros": 300,
  "detratores": 200,
  "percentual_promotores": 50.0,
  "percentual_detratores": 16.7
}
```

**Interpretação NPS:**
- **Acima de 50**: Excelente
- **30-50**: Bom
- **0-30**: Adequado
- **Negativo**: Crítico

**Quando usar:** Monitorar satisfação geral

---

### `get_analise_tickets_suporte()`

Análise de tickets de suporte.

**Retorno:**
```json
{
  "total_tickets": 1200,
  "tickets_abertos_total": 45,
  "tickets_fechados_total": 1155,
  "tempo_medio_resolucao_horas": 24.5,
  "nota_media_atendimento": 4.2,
  "clientes_com_tickets_abertos": 40
}
```

**Quando usar:** Performance do suporte

---

### `get_satisfacao_por_cliente()`

Satisfação segmentado por cliente.

**Retorno:**
```json
[
  {
    "nome_completo_cliente": "João Silva",
    "nota_media_atendimento": 4.8,
    "nota_media_produto": 4.5,
    "nps_medio_cliente": 9,
    "taxa_recomendacao_cliente": 95.0,
    "total_avaliacoes": 5,
    "total_tickets": 2,
    "tempo_medio_resolucao_horas": 12.5
  },
  // ... mais clientes
]
```

**Quando usar:** Análise de VIPs, clientes em risco

---

## 5️⃣ Análises de Engajamento

### `get_engajamento_digital()`

Métricas de engajamento digital dos clientes.

**Retorno:**
```json
{
  "sessoes_media": 8.5,
  "eventos_media": 32.3,
  "tempo_medio_pagina_seg": 45.2,
  "clientes_alta_engajamento": 300,
  "clientes_engajamento_medio": 400,
  "clientes_baixa_engajamento": 500
}
```

**Quando usar:** Análise de UX, conversão

---

### `get_comportamento_compra_por_origem()`

Como clientes de diferentes origens (canais) compram.

**Retorno:**
```json
[
  {
    "origem_cliente": "Organic",
    "total_clientes": 400,
    "ltv_medio": 500.00,
    "pedidos_medios": 10.5,
    "ticket_medio": 47.62,
    "receita_total": 200000.00,
    "recencia_media_dias": 30.5,
    "clientes_ativos": 350
  },
  {
    "origem_cliente": "Paid Ads",
    "total_clientes": 300,
    "ltv_medio": 400.00,
    // ...
  },
  // ... mais origens
]
```

**Quando usar:** ROI por canal, eficiência de aquisição

---

## 📌 Dicas de Customização

Se você quiser adicionar novas métricas, o padrão é:

```python
def get_nova_metrica():
    """Descrição clara da métrica"""
    try:
        query = """
        SELECT
            coluna1,
            coluna2,
            ROUND(coluna3, 2) AS valor_formatado
        FROM tabela
        WHERE condicao
        GROUP BY coluna1
        ORDER BY coluna1 DESC
        """
        return execute_query(query)
    except Exception as e:
        return {"erro": str(e)}
```

Depois adicione ao `available_tools` e `tools_definition`.

---

## 🔍 Estrutura das Tabelas

**Principais tabelas utilizadas:**
- `dm_cliente_360`: Visão 360 dos clientes (agregada com KPIs)
- `fato_vendas`: Transações de vendas
- `dim_cliente`: Dados demográficos dos clientes
- `dim_produto`: Catálogo de produtos
- `dm_vendas_periodo`: Vendas agregadas por período

---

**Última atualização:** Dezembro 2024
