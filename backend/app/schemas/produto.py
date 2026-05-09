from pydantic import BaseModel, Field
from typing import Optional


class ProdutoCreate(BaseModel):
    id_produto: Optional[str] = Field(None, description="ID do produto (opcional, será gerado automaticamente se não fornecido)")
    nome_produto: str = Field(..., description="Nome do produto")
    categoria_produto: str = Field(..., description="Categoria do produto")
    preco_produto: Optional[float] = Field(None, description="Preço do produto")
    fornecedor_produto: Optional[str] = Field(None, description="Fornecedor do produto")
    estoque_produto: Optional[int] = Field(None, description="Quantidade em estoque")
    produto_ativo: Optional[bool] = Field(True, description="Indica se o produto está ativo")


class ProdutoUpdate(BaseModel):
    nome_produto: Optional[str] = Field(None, description="Nome do produto")
    categoria_produto: Optional[str] = Field(None, description="Categoria do produto")
    preco_produto: Optional[float] = Field(None, description="Preço do produto")
    fornecedor_produto: Optional[str] = Field(None, description="Fornecedor do produto")
    estoque_produto: Optional[int] = Field(None, description="Quantidade em estoque")
    produto_ativo: Optional[bool] = Field(None, description="Indica se o produto está ativo")


class ProdutoResponse(BaseModel):
    id_produto: str
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    preco_produto: Optional[float] = None
    fornecedor_produto: Optional[str] = None
    estoque_produto: Optional[int] = None
    produto_ativo: Optional[bool] = None
    faixa_preco: Optional[str] = None

    model_config = {"from_attributes": True}


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

