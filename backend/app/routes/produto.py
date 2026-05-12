from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from bd.database import get_db, get_db_gold
from app.models import DimProduto, Produto360
from app.schemas import ProdutoMetricas, ProdutoCreate, ProdutoUpdate, ProdutoResponse
from app.services import (
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
    limit: int = Query(50, ge=1, le=10000, description="Limite de registros por página"),
    db: Session = Depends(get_db),
    db_gold: Session = Depends(get_db_gold),
):
    # bsca os dados em tempo real da camada Silver (Garante CRUD instantâneo para novo, edit e delete!)
    query = db.query(DimProduto)

    if busca:
        query = query.filter(DimProduto.nome_produto.ilike(f"%{busca}%"))
    if categoria:
        query = query.filter(DimProduto.categoria_produto.ilike(f"%{categoria}%"))
    if faixa_preco:
        query = query.filter(DimProduto.faixa_preco == faixa_preco)
    if produto_ativo is not None:
        query = query.filter(DimProduto.produto_ativo == produto_ativo)

    produtos_silver = query.offset(skip).limit(limit).all()
    if not produtos_silver:
        return []

    # busca as metricas na camada Gold
    ids_produtos = [p.id_produto for p in produtos_silver]
    metrics_gold = db_gold.query(Produto360).filter(Produto360.id_produto.in_(ids_produtos)).all()
    metrics_map = {m.id_produto: m for m in metrics_gold}

    # mesclagem de memoria pra tentar fazer a consulta mais rapida
    result = []
    for p in produtos_silver:
        m = metrics_map.get(p.id_produto)
        
        taxa_rec = None
        if m and m.taxa_recomendacao_produto is not None:
            # logica de que sefor decimal (ex: <= 1.0), converte para percentual (0.78 -> 78.0) - averiguar
            taxa_rec = m.taxa_recomendacao_produto * 100 if m.taxa_recomendacao_produto <= 1.0 else m.taxa_recomendacao_produto
            taxa_rec = round(taxa_rec, 2)

        result.append(ProdutoMetricas(
            id_produto=p.id_produto,
            nome_produto=p.nome_produto,
            categoria_produto=p.categoria_produto,
            preco_produto=p.preco_produto,
            faixa_preco=p.faixa_preco,
            estoque_produto=p.estoque_produto,
            produto_ativo=p.produto_ativo,
            fornecedor_produto=p.fornecedor_produto,
            
            total_pedidos=m.total_pedidos if m else 0,
            quantidade_vendida=m.quantidade_vendida if m else 0,
            receita_total=m.receita_total_produto if m else 0.0,
            ticket_medio=round(m.ticket_medio_produto, 2) if m and m.ticket_medio_produto is not None else None,
            
            total_avaliacoes=m.total_avaliacoes if m else 0,
            nota_media=round(m.nota_media_produto, 2) if m and m.nota_media_produto is not None else None,
            nps_medio=round(m.nps_medio_produto, 2) if m and m.nps_medio_produto is not None else None,
            taxa_recomendacao=taxa_rec,
            
            total_tickets=m.total_tickets_produto if m else 0,

            # Novos campos da Gold
            peso_kg_produto=m.peso_kg_produto if m else None,
            status_estoque_produto=m.status_estoque_produto if m else None,
            data_cadastro_produto=m.data_cadastro_produto if m else None,
            data_primeira_venda=m.data_primeira_venda if m else None,
            data_ultima_venda=m.data_ultima_venda if m else None,
            pedidos_entregues=m.pedidos_entregues if m else 0,
            pedidos_cancelados=m.pedidos_cancelados if m else 0,
            pedidos_reembolsados=m.pedidos_reembolsados if m else 0,
            tempo_medio_resolucao_produto=round(m.tempo_medio_resolucao_produto, 2) if m and m.tempo_medio_resolucao_produto is not None else None,
            total_eventos_produto=m.total_eventos_produto if m else 0,
            total_sessoes_produto=m.total_sessoes_produto if m else 0,
            total_pageviews_produto=m.total_pageviews_produto if m else 0,
            total_add_carrinho_produto=m.total_add_carrinho_produto if m else 0,
            total_eventos_compra_produto=m.total_eventos_compra_produto if m else 0,
            status_comercial_produto=m.status_comercial_produto if m else "Novo",
            produto_com_alto_volume_suporte=m.produto_com_alto_volume_suporte if m else False,
        ))

    return result


@router.get("/metricas/{produto_id}", response_model=ProdutoMetricas)
def buscar_metricas_produto(
    produto_id: str, 
    db: Session = Depends(get_db),
    db_gold: Session = Depends(get_db_gold)
):
    p = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    m = db_gold.query(Produto360).filter(Produto360.id_produto == produto_id).first()

    taxa_rec = None
    if m and m.taxa_recomendacao_produto is not None:
        taxa_rec = m.taxa_recomendacao_produto * 100 if m.taxa_recomendacao_produto <= 1.0 else m.taxa_recomendacao_produto
        taxa_rec = round(taxa_rec, 2)

    return ProdutoMetricas(
        id_produto=p.id_produto,
        nome_produto=p.nome_produto,
        categoria_produto=p.categoria_produto,
        preco_produto=p.preco_produto,
        faixa_preco=p.faixa_preco,
        estoque_produto=p.estoque_produto,
        produto_ativo=p.produto_ativo,
        fornecedor_produto=p.fornecedor_produto,
        
        total_pedidos=m.total_pedidos if m else 0,
        quantidade_vendida=m.quantidade_vendida if m else 0,
        receita_total=m.receita_total_produto if m else 0.0,
        ticket_medio=round(m.ticket_medio_produto, 2) if m and m.ticket_medio_produto is not None else None,
        
        total_avaliacoes=m.total_avaliacoes if m else 0,
        nota_media=round(m.nota_media_produto, 2) if m and m.nota_media_produto is not None else None,
        nps_medio=round(m.nps_medio_produto, 2) if m and m.nps_medio_produto is not None else None,
        taxa_recomendacao=taxa_rec,
        
        total_tickets=m.total_tickets_produto if m else 0,

        # Novos campos da Gold
        peso_kg_produto=m.peso_kg_produto if m else None,
        status_estoque_produto=m.status_estoque_produto if m else None,
        data_cadastro_produto=m.data_cadastro_produto if m else None,
        data_primeira_venda=m.data_primeira_venda if m else None,
        data_ultima_venda=m.data_ultima_venda if m else None,
        pedidos_entregues=m.pedidos_entregues if m else 0,
        pedidos_cancelados=m.pedidos_cancelados if m else 0,
        pedidos_reembolsados=m.pedidos_reembolsados if m else 0,
        tempo_medio_resolucao_produto=round(m.tempo_medio_resolucao_produto, 2) if m and m.tempo_medio_resolucao_produto is not None else None,
        total_eventos_produto=m.total_eventos_produto if m else 0,
        total_sessoes_produto=m.total_sessoes_produto if m else 0,
        total_pageviews_produto=m.total_pageviews_produto if m else 0,
        total_add_carrinho_produto=m.total_add_carrinho_produto if m else 0,
        total_eventos_compra_produto=m.total_eventos_compra_produto if m else 0,
        status_comercial_produto=m.status_comercial_produto if m else "Novo",
        produto_com_alto_volume_suporte=m.produto_com_alto_volume_suporte if m else False,
    )


@router.get("/", response_model=List[ProdutoResponse], summary="Listagem básica de produtos")
def listar_produtos(
    busca: Optional[str] = Query(None, description="Busca por nome ou fornecedor"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    produto_ativo: Optional[bool] = Query(None, description="Filtrar por status ativo/inativo"),
    skip: int = Query(0, ge=0, description="Pular N registros"),
    limit: int = Query(50, ge=1, le=10000, description="Limite de registros"),
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

