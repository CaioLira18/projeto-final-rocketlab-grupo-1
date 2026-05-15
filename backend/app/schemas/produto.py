import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any

# ==============================================================================
# FUNÇÕES DE HIGIENIZAÇÃO (PADRÃO CAMADA SILVER DO DATABRICKS)
# ==============================================================================

def clean_nome_produto(v: Any) -> Optional[str]:
    if v is None:
        return None
    val_str = str(v).strip()
    if val_str == "":
        raise ValueError("O nome do produto não pode ser vazio")
    return val_str

def clean_categoria_produto(v: Any) -> str:
    if v is None:
        return "Outros"
    # Trim e lower
    cat = str(v).strip().lower()
    # Remove números e o caractere @
    cat = re.sub(r"[0-9@]", "", cat)
    # Mapeamento oficial da camada Silver do Databricks
    if cat in ["eletronicos", "eletronico", "elet", "electronico", "electronics"]:
        return "Eletrônicos"
    elif cat in ["vestuario", "vestu", "vest", "vestuarios", "moda", "roupa", "roupas"]:
        return "Vestuário"
    elif cat in ["casa", "cas", "casa e jardim", "lar"]:
        return "Casa"
    elif cat in ["esportes", "esporte", "esport", "esp", "sport", "sports"]:
        return "Esportes"
    elif cat in ["beleza", "bel", "belz", "cosmeticos", "cosméticos"]:
        return "Beleza"
    elif cat in ["automotivo", "autom", "aut", "automotiv", "auto"]:
        return "Automotivo"
    elif cat in ["brinquedo", "brinquedos", "brin", "brinq", "toys"]:
        return "Brinquedos"
    elif cat in ["moveis", "mov", "mveis", "móveis", "furniture"]:
        return "Móveis"
    else:
        return "Outros"

def clean_preco_produto(v: Any) -> Optional[float]:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        val_float = float(v)
    else:
        val_str = str(v).strip()
        if val_str.lower() in ["null", "none", ""]:
            return None
        # Limpa R$, espaços e converte vírgula para ponto
        val_str = re.sub(r"[R$\s]", "", val_str)
        val_str = val_str.replace(",", ".")
        try:
            val_float = float(val_str)
        except ValueError:
            raise ValueError("Preço do produto inválido")
            
    if val_float <= 0:
        raise ValueError("O preço do produto deve ser maior que zero")
    return val_float

def clean_estoque_produto(v: Any) -> int:
    if v is None:
        return 0
    if isinstance(v, int):
        val_int = v
    elif isinstance(v, float):
        val_int = int(v)
    else:
        val_str = str(v).strip()
        if val_str.lower() in ["null", "none", ""]:
            return 0
        try:
            val_int = int(float(val_str))
        except ValueError:
            return 0
            
    if val_int < 0:
        raise ValueError("A quantidade em estoque não pode ser negativa")
    return val_int

def clean_produto_ativo(v: Any) -> Optional[bool]:
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    val_str = str(v).strip().lower()
    if val_str in ["s", "sim", "yes", "1", "true"]:
        return True
    elif val_str in ["n", "nao", "não", "no", "0", "false"]:
        return False
    return None

def clean_fornecedor_produto(v: Any) -> Optional[str]:
    if v is None:
        return None
    val_str = str(v).strip()
    if val_str.lower() in ["null", "none", ""]:
        return None
    return val_str


class ProdutoCreate(BaseModel):
    id_produto: Optional[str] = Field(None, description="ID do produto (opcional, será gerado automaticamente se não fornecido)")
    nome_produto: str = Field(..., description="Nome do produto")
    categoria_produto: str = Field(..., description="Categoria do produto")
    preco_produto: Optional[float] = Field(None, description="Preço do produto")
    fornecedor_produto: Optional[str] = Field(None, description="Fornecedor do produto")
    estoque_produto: Optional[int] = Field(None, description="Quantidade em estoque")
    produto_ativo: Optional[bool] = Field(True, description="Indica se o produto está ativo")
    peso_kg_produto: Optional[float] = Field(None, description="Peso do produto em kg")

    @field_validator("id_produto", mode="before")
    @classmethod
    def val_id_produto(cls, v):
        if v is None:
            return None
        val_str = str(v).strip().upper()
        if val_str == "":
            return None
        if not re.match(r"^PROD-\d{4}$", val_str):
            raise ValueError("O código SKU deve seguir o formato padrão oficial: PROD-XXXX (onde X é um dígito de 0 a 9). Ex: PROD-0020")
        return val_str

    @field_validator("nome_produto", mode="before")
    @classmethod
    def val_nome_produto(cls, v):
        return clean_nome_produto(v)

    @field_validator("categoria_produto", mode="before")
    @classmethod
    def val_categoria_produto(cls, v):
        return clean_categoria_produto(v)

    @field_validator("preco_produto", mode="before")
    @classmethod
    def val_preco_produto(cls, v):
        return clean_preco_produto(v)

    @field_validator("estoque_produto", mode="before")
    @classmethod
    def val_estoque_produto(cls, v):
        return clean_estoque_produto(v)

    @field_validator("produto_ativo", mode="before")
    @classmethod
    def val_produto_ativo(cls, v):
        return clean_produto_ativo(v)

    @field_validator("fornecedor_produto", mode="before")
    @classmethod
    def val_fornecedor_produto(cls, v):
        return clean_fornecedor_produto(v)


class ProdutoUpdate(BaseModel):
    nome_produto: Optional[str] = Field(None, description="Nome do produto")
    categoria_produto: Optional[str] = Field(None, description="Categoria do produto")
    preco_produto: Optional[float] = Field(None, description="Preço do produto")
    fornecedor_produto: Optional[str] = Field(None, description="Fornecedor do produto")
    estoque_produto: Optional[int] = Field(None, description="Quantidade em estoque")
    produto_ativo: Optional[bool] = Field(None, description="Indica se o produto está ativo")
    peso_kg_produto: Optional[float] = Field(None, description="Peso do produto em kg")

    @field_validator("nome_produto", mode="before")
    @classmethod
    def val_nome_produto(cls, v):
        if v is None:
            return None
        return clean_nome_produto(v)

    @field_validator("categoria_produto", mode="before")
    @classmethod
    def val_categoria_produto(cls, v):
        if v is None:
            return None
        return clean_categoria_produto(v)

    @field_validator("preco_produto", mode="before")
    @classmethod
    def val_preco_produto(cls, v):
        if v is None:
            return None
        return clean_preco_produto(v)

    @field_validator("estoque_produto", mode="before")
    @classmethod
    def val_estoque_produto(cls, v):
        if v is None:
            return None
        return clean_estoque_produto(v)

    @field_validator("produto_ativo", mode="before")
    @classmethod
    def val_produto_ativo(cls, v):
        if v is None:
            return None
        return clean_produto_ativo(v)

    @field_validator("fornecedor_produto", mode="before")
    @classmethod
    def val_fornecedor_produto(cls, v):
        if v is None:
            return None
        return clean_fornecedor_produto(v)



class ProdutoResponse(BaseModel):
    id_produto: str
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    preco_produto: Optional[float] = None
    fornecedor_produto: Optional[str] = None
    estoque_produto: Optional[int] = None
    produto_ativo: Optional[bool] = None
    faixa_preco: Optional[str] = None
    ja_tratada: Optional[bool] = None

    model_config = {"from_attributes": True}


class ProdutoMetricas(BaseModel):
    id_produto: str
    nome_produto: Optional[str] = None
    categoria_produto: Optional[str] = None
    preco_produto: Optional[float] = None
    faixa_preco: Optional[str] = None
    estoque_produto: Optional[int] = None
    produto_active: Optional[bool] = None  # vou remover, mas to colocando aq pra fins de teste
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

    # Campos Analíticos Avançados da Camada Gold
    peso_kg_produto: Optional[float] = None
    status_estoque_produto: Optional[str] = None
    data_cadastro_produto: Optional[str] = None
    data_primeira_venda: Optional[str] = None
    data_ultima_venda: Optional[str] = None
    pedidos_aprovados: Optional[int] = None
    pedidos_recusados: Optional[int] = None
    pedidos_processando: Optional[int] = None
    pedidos_reembolsados: Optional[int] = None
    tempo_medio_resolucao_produto: Optional[float] = None
    total_eventos_produto: Optional[int] = None
    total_sessoes_produto: Optional[int] = None
    total_pageviews_produto: Optional[int] = None
    total_add_carrinho_produto: Optional[int] = None
    total_eventos_compra_produto: Optional[int] = None
    status_comercial_produto: Optional[str] = None
    produto_com_alto_volume_suporte: Optional[bool] = None

    model_config = {"from_attributes": True}

