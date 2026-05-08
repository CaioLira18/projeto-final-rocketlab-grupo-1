from pydantic import BaseModel
from typing import Optional

class SuporteTicketItem(BaseModel):
    ticket_id: str # Obrigatório
    id_cliente: Optional[str] = None
    nome_cliente: Optional[str] = None
    id_pedido: Optional[str] = None
    id_produto: Optional[str] = None
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    data_pedido: Optional[str] = None
    tipo_problema: Optional[str] = None
    data_abertura: Optional[str] = None
    data_resolucao: Optional[str] = None
    tempo_resolucao_horas: Optional[float] = None # Na gold ta exportando como int, mas faz mais sentido como float para calcular a média de tempo de resolução
    agente_suporte: Optional[str] = None
    status: str = "aberto"
  
    model_config = {"from_attributes": True} 

# Formata a resposta estatística de um produto específico.
class SuporteMetricasProduto(BaseModel):
    id_produto: str # Obrigatório
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    # Padronizar como 0 para não retornar null
    total_tickets: int = 0
    tickets_abertos: int = 0
    tickets_resolvidos: int = 0
    # None pois pode ter 0 ticket
    tempo_resolucao_medio: Optional[float] = None
    taxa_resolucao: Optional[float] = None

    model_config = {"from_attributes": True}