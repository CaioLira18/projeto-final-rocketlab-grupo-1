from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from app.schemas.produto import ProdutoMetricas
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/produtos", tags=["Produtos"])


@router.get("/metricas", response_model=List[ProdutoMetricas])
def listar_metricas_produtos(
    categoria: Optional[str] = Query(None, description="Filtrar por categoria do produto"),
    faixa_preco: Optional[str] = Query(None, description="Filtrar por faixa de preço (baixo/medio/alto)"),
    produto_ativo: Optional[bool] = Query(None, description="Filtrar produtos ativos (true) ou inativos (false)"),
    busca: Optional[str] = Query(None, description="Busca por nome do produto"),
    skip: int = Query(0, ge=0, description="Registros para pular (paginação)"),
    limit: int = Query(50, ge=1, le=500, description="Limite de registros por página"),
    db: Session = Depends(get_db),
):
    return ProdutoService.listar_metricas_produtos(
        db=db,
        categoria=categoria,
        faixa_preco=faixa_preco,
        produto_ativo=produto_ativo,
        busca=busca,
        skip=skip,
        limit=limit,
    )


@router.get("/metricas/{produto_id}", response_model=ProdutoMetricas)
def buscar_metricas_produto(produto_id: str, db: Session = Depends(get_db)):
    resultado = ProdutoService.buscar_metricas_produto(db, produto_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return resultado
