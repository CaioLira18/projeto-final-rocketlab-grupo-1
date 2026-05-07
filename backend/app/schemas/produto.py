from pydantic import BaseModel
from typing import Optional

class ProdutoMetricas(BaseModel):
    id_produto: str
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    preco_produto: Optional[float] = None
    faixa_preco: Optional[str] = None
    estoque_produto: Optional[int] = None
    produto_ativo: Optional[bool] = None
    fornecedor_produto: Optional[str] = None
    total_pedidos: int = 0
    quantidade_vendida: int = 0
    receita_total: float = 0.0
    ticket_medio: Optional[float] = None
    total_avaliacoes: int = 0
    nota_media: Optional[float] = None
    nps_medio: Optional[float] = None
    taxa_recomendacao: Optional[float] = None
    total_tickets: int = 0

    model_config = {"from_attributes": True}
