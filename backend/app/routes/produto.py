from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from bd.database import get_db
from app.models import DimProduto
from app.schemas import ProdutoMetricas, ProdutoCreate, ProdutoUpdate, ProdutoResponse
from app.services import (
    build_product_metric_subqueries,
    map_row_to_product_metric_schema,
    create_produto,
    update_produto,
    delete_produto,
)
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"],
    dependencies=[Depends(get_current_user)]
)


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
    sq_vendas, sq_avaliacoes, sq_suporte = build_product_metric_subqueries()

    query = (
        db.query(
            DimProduto.id_produto,
            DimProduto.nome_produto,
            DimProduto.categoria_produto,
            DimProduto.preco_produto,
            DimProduto.faixa_preco,
            DimProduto.estoque_produto,
            DimProduto.produto_ativo,
            DimProduto.fornecedor_produto,
            sq_vendas.c.total_pedidos,
            sq_vendas.c.quantidade_vendida,
            sq_vendas.c.receita_total,
            sq_vendas.c.ticket_medio,
            sq_avaliacoes.c.total_avaliacoes,
            sq_avaliacoes.c.nota_media,
            sq_avaliacoes.c.nps_medio,
            sq_avaliacoes.c.taxa_recomendacao,
            sq_suporte.c.total_tickets,
        )
        .outerjoin(sq_vendas, DimProduto.id_produto == sq_vendas.c.id_produto)
        .outerjoin(sq_avaliacoes, DimProduto.id_produto == sq_avaliacoes.c.id_produto)
        .outerjoin(sq_suporte, DimProduto.id_produto == sq_suporte.c.id_produto)
    )

    if busca:
        query = query.filter(DimProduto.nome_produto.ilike(f"%{busca}%"))
    if categoria:
        query = query.filter(DimProduto.categoria_produto.ilike(f"%{categoria}%"))
    if faixa_preco:
        query = query.filter(DimProduto.faixa_preco == faixa_preco)
    if produto_ativo is not None:
        query = query.filter(DimProduto.produto_ativo == produto_ativo)

    return [map_row_to_product_metric_schema(r) for r in query.offset(skip).limit(limit).all()]


@router.get("/metricas/{produto_id}", response_model=ProdutoMetricas)
def buscar_metricas_produto(produto_id: str, db: Session = Depends(get_db)):
    sq_vendas, sq_avaliacoes, sq_suporte = build_product_metric_subqueries()

    resultado = (
        db.query(
            DimProduto.id_produto,
            DimProduto.nome_produto,
            DimProduto.categoria_produto,
            DimProduto.preco_produto,
            DimProduto.faixa_preco,
            DimProduto.estoque_produto,
            DimProduto.produto_ativo,
            DimProduto.fornecedor_produto,
            sq_vendas.c.total_pedidos,
            sq_vendas.c.quantidade_vendida,
            sq_vendas.c.receita_total,
            sq_vendas.c.ticket_medio,
            sq_avaliacoes.c.total_avaliacoes,
            sq_avaliacoes.c.nota_media,
            sq_avaliacoes.c.nps_medio,
            sq_avaliacoes.c.taxa_recomendacao,
            sq_suporte.c.total_tickets,
        )
        .outerjoin(sq_vendas, DimProduto.id_produto == sq_vendas.c.id_produto)
        .outerjoin(sq_avaliacoes, DimProduto.id_produto == sq_avaliacoes.c.id_produto)
        .outerjoin(sq_suporte, DimProduto.id_produto == sq_suporte.c.id_produto)
        .filter(DimProduto.id_produto == produto_id)
        .first()
    )

    if not resultado:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    return map_row_to_product_metric_schema(resultado)


@router.get("/", response_model=List[ProdutoResponse], summary="Listagem básica de produtos")
def listar_produtos(
    busca: Optional[str] = Query(None, description="Busca por nome ou fornecedor"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    produto_ativo: Optional[bool] = Query(None, description="Filtrar por status ativo/inativo"),
    skip: int = Query(0, ge=0, description="Pular N registros"),
    limit: int = Query(50, ge=1, le=500, description="Limite de registros"),
    db: Session = Depends(get_db),
):
    query = db.query(DimProduto)
    if busca:
        query = query.filter(
            DimProduto.nome_produto.ilike(f"%{busca}%") | 
            DimProduto.fornecedor_produto.ilike(f"%{busca}%")
        )
    if categoria:
        query = query.filter(DimProduto.categoria_produto.ilike(f"%{categoria}%"))
    if produto_ativo is not None:
        query = query.filter(DimProduto.produto_ativo == produto_ativo)
    return query.offset(skip).limit(limit).all()


@router.get("/{produto_id}", response_model=ProdutoResponse, summary="Busca básica de produto")
def buscar_produto(produto_id: str, db: Session = Depends(get_db)):
    produto = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.post("/", response_model=ProdutoResponse, status_code=201, summary="Adiciona um novo produto")
def adicionar_produto(prod_in: ProdutoCreate, db: Session = Depends(get_db)):
    return create_produto(db, prod_in)


@router.put("/{produto_id}", response_model=ProdutoResponse, summary="Edita um produto existente")
def editar_produto(produto_id: str, prod_in: ProdutoUpdate, db: Session = Depends(get_db)):
    return update_produto(db, produto_id, prod_in)


@router.delete("/{produto_id}", summary="Remove um produto")
def remover_produto(produto_id: str, db: Session = Depends(get_db)):
    delete_produto(db, produto_id)
    return {"message": "Produto removido com sucesso", "id_produto": produto_id}

