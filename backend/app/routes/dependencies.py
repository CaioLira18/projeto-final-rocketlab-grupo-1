"""
Dependências de autorização (RBAC) reutilizáveis pelos routers da API.

Cada constante `require_*` é uma instância de RoleChecker representando o
conjunto de roles autorizadas a acessar um determinado domínio. A role
'admin' não precisa aparecer nas listas porque o RoleChecker já libera
acesso irrestrito para administradores via curto-circuito interno.

Esta matriz reflete a decisão de RBAC documentada no README, seção
"Permissões e Roles".
"""
from app.routes.auth import RoleChecker

# Dashboard: agregados de Gold (VendasPeriodo + Cliente360). Restrito aos papéis
# que também têm acesso ao detalhe das mesmas entidades (pedidos + cliente 360),
# para evitar que o dashboard vire um canal lateral para dados que a role não
# pode ver na página individual.
require_dashboard = RoleChecker([
    "gerente_comercial",
    "analista_crm",
])

# Leitura de clientes: todos os papéis operacionais precisam consultar o cadastro.
# Gerente de produtos fica de fora porque atua sobre catálogo, não sobre clientes.
require_clientes_read = RoleChecker([
    "gerente_comercial",
    "analista_crm",
    "analista_operacoes",
    "operador_suporte",
])

# Visão 360 do cliente é dado sensível agregado (LTV, NPS, etc.) — restrito a quem precisa da visão estratégica de relacionamento.
require_cliente_360 = RoleChecker([
    "gerente_comercial",
    "analista_crm",
])

# Pedidos: visão operacional. Gerente de produtos fica de fora pelo mesmo motivo de clientes.
require_pedidos = RoleChecker([
    "gerente_comercial",
    "analista_crm",
    "analista_operacoes",
    "operador_suporte",
])

# Leitura do catálogo de produtos: todos os papéis operacionais.
require_produtos_read = RoleChecker([
    "gerente_comercial",
    "analista_crm",
    "analista_operacoes",
    "gerente_produtos",
    "operador_suporte",
])

# Escrita no catálogo (criar/editar/remover produto): apenas o gerente de produtos (e admin via bypass).
require_produtos_write = RoleChecker([
    "gerente_produtos",
])

# Suporte: tickets e métricas relacionadas. Operações e produtos não atendem clientes.
require_suporte = RoleChecker([
    "gerente_comercial",
    "analista_crm",
    "operador_suporte",
])

# Exportação de dados em CSV: ação sensível. Papéis de gestão + analista CRM
# (que já enxerga todos os dados exportáveis pela matriz).
require_export = RoleChecker([
    "gerente_comercial",
    "analista_crm",
    "gerente_produtos",
])

# Agente IA (chat): consulta o banco Gold (dim_cliente, dim_produto,
# dm_cliente_360, dm_produto_360, dm_vendas_periodo). Restrito aos papéis que
# também têm acesso aos detalhes dessas mesmas entidades nas páginas (clientes,
# 360, pedidos, produtos). Sem isso, o chat seria um canal lateral para dados
# que a role não pode ver de forma direta.
require_chat = RoleChecker([
    "gerente_comercial",
    "analista_crm",
])
