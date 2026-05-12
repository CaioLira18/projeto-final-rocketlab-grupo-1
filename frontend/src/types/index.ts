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
export interface DashboardKPIs {
  total_vendas: number
  total_clientes: number
  ticket_medio: number
  total_pedidos: number
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
}

/* Pedido */
export interface Pedido {
  id: number
  cliente_id: number
  produto_id: number
  quantidade: number
  valor_total: number
  data_pedido: string
  status: string
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
