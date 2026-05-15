/* Tipos e interfaces globais, espelham os schemas do back */

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

/* Auth */
export interface User {
  id: number
  username: string
}

/* Dashboard */
export interface MonthlySales {
  mes_referencia: string
  receita: number
  pedidos: number
}

export interface CategorySales {
  categoria: string
  receita: number
  pedidos: number
}

export interface StateSales {
  estado: string
  receita: number
  clientes: number
}

export interface PaymentMethodSales {
  metodo: string
  receita: number
  pedidos: number
}

export interface CustomerSegment {
  faixa: string
  quantidade: number
}

export interface DashboardKPIs {
  totalRevenue: number
  totalSales: number
  totalCustomers: number
  averageOrderValue: number
  monthlySales: MonthlySales[]
  categorySales: CategorySales[]
  stateSales: StateSales[]
  paymentSales: PaymentMethodSales[]
  customerSegments: CustomerSegment[]
}

/* Cliente */
export interface Cliente {
  id: number
  nome: string
  email: string
  cidade: string
  estado: string
  data_nascimento: string
  idade: number
}

export interface Cliente360 {
  id: number
  nome: string
  ltv: number
  recencia: number
  nps: number
  total_tickets: number
}

/* Produto */
export interface Produto {
  id_produto: string
  nome_produto?: string
  categoria_produto?: string
  preco_produto?: number
  fornecedor_produto?: string
  estoque_produto?: number
  produto_ativo?: boolean
  faixa_preco?: string
}

export interface ProdutoMetricas {
  id_produto: string
  nome_produto?: string
  categoria_produto?: string
  preco_produto?: number
  faixa_preco?: string
  estoque_produto?: number
  produto_ativo?: boolean
  fornecedor_produto?: string
  total_pedidos: number
  quantidade_vendida: number
  receita_total: number
  ticket_medio?: number
  total_avaliacoes: number
  nota_media?: number
  nps_medio?: number
  taxa_recomendacao?: number
  total_tickets: number

  // Campos Analíticos Avançados da Camada Gold
  peso_kg_produto?: number
  status_estoque_produto?: string
  data_cadastro_produto?: string
  data_primeira_venda?: string
  data_ultima_venda?: string
  pedidos_entregues?: number
  pedidos_cancelados?: number
  pedidos_reembolsados?: number
  tempo_medio_resolucao_produto?: number
  total_eventos_produto?: number
  total_sessoes_produto?: number
  total_pageviews_produto?: number
  total_add_carrinho_produto?: number
  total_eventos_compra_produto?: number
  status_comercial_produto?: string
  produto_com_alto_volume_suporte?: boolean
}

/* Pedido */
export interface Pedido {
  id_pedido: string
  data_pedido: string | null
  id_cliente: string | null
  nome_cliente: string | null
  id_produto: string | null
  nome_produto: string | null
  categoria_produto: string | null
  quantidade_produto: number | null
  valor_pedido: number | null
  metodo_pagamento: string | null
  status_pedido: string | null
  data_prevista_entrega: string | null
}

/* Suporte */
export interface Ticket {
  id: number
  cliente_id: number
  assunto: string
  status: string
  prioridade: string
  data_abertura: string
}
