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
  id: number
  nome: string
  categoria: string
  preco: number
  estoque: number
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
