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
from app.routes.dependencies import require_produtos_read, require_produtos_write

router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"],
    dependencies=[Depends(require_produtos_read)]
)


@router.get("/metricas", response_model=List[ProdutoMetricas], summary="Lista produtos com métricas agregadas (Gold)")
def listar_metricas_produtos(
    categoria: Optional[str] = Query(None, description="Filtrar por categoria do produto"),
    faixa_preco: Optional[str] = Query(None, description="Filtrar por faixa de preço (baixo/medio/alto)"),
    produto_ativo: Optional[bool] = Query(None, description="Filtrar produtos ativos (true) ou inativos (false)"),
    busca: Optional[str] = Query(None, description="Busca por nome do produto"),
    skip: int = Query(0, ge=0, description="Registros para pular (paginação)"),
    limit: int = Query(50, ge=1, le=10000, description="Limite de registros por página"),
    db_gold: Session = Depends(get_db_gold),
):
    """
    Lista produtos com todas as métricas consolidadas pela camada Gold:
    receita total, ticket médio, total de pedidos, avaliações, NPS, tickets
    de suporte, métricas de engajamento digital, etc.

    Aceita filtros de categoria, faixa de preço, status (ativo/inativo) e
    busca livre (nome/ID/fornecedor). Usado pela tela principal de Produtos.
    """
    # sincronização real-time ativa, pra a gente ter aqui os dados mais recentes possiveis
    query = db_gold.query(Produto360).order_by(Produto360.id_produto.asc())

    if busca:
        query = query.filter(
            Produto360.nome_produto.ilike(f"%{busca}%") | 
            Produto360.id_produto.ilike(f"%{busca}%") |
            Produto360.fornecedor_produto.ilike(f"%{busca}%")
        )
    if categoria:
        query = query.filter(Produto360.categoria_produto.ilike(f"%{categoria}%"))
    if faixa_preco:
        query = query.filter(Produto360.faixa_preco_produto == faixa_preco)
    if produto_ativo is not None:
        query = query.filter(Produto360.produto_ativo == produto_ativo)

    produtos_gold = query.offset(skip).limit(limit).all()
    if not produtos_gold:
        return []

    result = []
    for m in produtos_gold:
        taxa_rec = None
        if m.taxa_recomendacao_produto is not None:
            taxa_rec = m.taxa_recomendacao_produto * 100 if m.taxa_recomendacao_produto <= 1.0 else m.taxa_recomendacao_produto
            taxa_rec = round(taxa_rec, 2)

        result.append(ProdutoMetricas(
            id_produto=m.id_produto,
            nome_produto=m.nome_produto,
            categoria_produto=m.categoria_produto,
            preco_produto=m.preco_produto,
            faixa_preco=m.faixa_preco_produto,
            estoque_produto=m.estoque_produto,
            produto_ativo=m.produto_ativo,
            fornecedor_produto=m.fornecedor_produto,
            
            total_pedidos=m.total_pedidos if m.total_pedidos is not None else 0,
            quantidade_vendida=m.quantidade_vendida if m.quantidade_vendida is not None else 0,
            receita_total=m.receita_total_produto if m.receita_total_produto is not None else 0.0,
            ticket_medio=round(m.ticket_medio_produto, 2) if m.ticket_medio_produto is not None else None,
            
            total_avaliacoes=m.total_avaliacoes if m.total_avaliacoes is not None else 0,
            nota_media=round(m.nota_media_produto, 2) if m.nota_media_produto is not None else None,
            nps_medio=round(m.nps_medio_produto, 2) if m.nps_medio_produto is not None else None,
            taxa_recomendacao=taxa_rec,
            
            total_tickets=m.total_tickets_produto if m.total_tickets_produto is not None else 0,

            # Novos campos da Gold
            peso_kg_produto=m.peso_kg_produto,
            status_estoque_produto=m.status_estoque_produto,
            data_cadastro_produto=m.data_cadastro_produto,
            data_primeira_venda=m.data_primeira_venda,
            data_ultima_venda=m.data_ultima_venda,
            pedidos_aprovados=m.pedidos_aprovados if m.pedidos_aprovados is not None else 0,
            pedidos_recusados=m.pedidos_recusados if m.pedidos_recusados is not None else 0,
            pedidos_processando=m.pedidos_processando if m.pedidos_processando is not None else 0,
            pedidos_reembolsados=m.pedidos_reembolsados if m.pedidos_reembolsados is not None else 0,
            tempo_medio_resolucao_produto=round(m.tempo_medio_resolucao_produto, 2) if m.tempo_medio_resolucao_produto is not None else None,
            total_eventos_produto=m.total_eventos_produto if m.total_eventos_produto is not None else 0,
            total_sessoes_produto=m.total_sessoes_produto if m.total_sessoes_produto is not None else 0,
            total_pageviews_produto=m.total_pageviews_produto if m.total_pageviews_produto is not None else 0,
            total_add_carrinho_produto=m.total_add_carrinho_produto if m.total_add_carrinho_produto is not None else 0,
            total_eventos_compra_produto=m.total_eventos_compra_produto if m.total_eventos_compra_produto is not None else 0,
            status_comercial_produto=m.status_comercial_produto or "Novo",
            produto_com_alto_volume_suporte=m.produto_com_alto_volume_suporte or False,
        ))

    return result


@router.get("/metricas/{produto_id}", response_model=ProdutoMetricas, summary="Métricas agregadas de um produto (Gold)")
def buscar_metricas_produto(
    produto_id: str,
    db_gold: Session = Depends(get_db_gold)
):
    """
    Retorna as métricas Gold completas de um único produto. Retorna 404 se
    o `produto_id` não existir na camada Gold.
    """
    m = db_gold.query(Produto360).filter(Produto360.id_produto == produto_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    taxa_rec = None
    if m.taxa_recomendacao_produto is not None:
        taxa_rec = m.taxa_recomendacao_produto * 100 if m.taxa_recomendacao_produto <= 1.0 else m.taxa_recomendacao_produto
        taxa_rec = round(taxa_rec, 2)

    return ProdutoMetricas(
        id_produto=m.id_produto,
        nome_produto=m.nome_produto,
        categoria_produto=m.categoria_produto,
        preco_produto=m.preco_produto,
        faixa_preco=m.faixa_preco_produto,
        estoque_produto=m.estoque_produto,
        produto_ativo=m.produto_ativo,
        fornecedor_produto=m.fornecedor_produto,
        
        total_pedidos=m.total_pedidos if m.total_pedidos is not None else 0,
        quantidade_vendida=m.quantidade_vendida if m.quantidade_vendida is not None else 0,
        receita_total=m.receita_total_produto if m.receita_total_produto is not None else 0.0,
        ticket_medio=round(m.ticket_medio_produto, 2) if m.ticket_medio_produto is not None else None,
        
        total_avaliacoes=m.total_avaliacoes if m.total_avaliacoes is not None else 0,
        nota_media=round(m.nota_media_produto, 2) if m.nota_media_produto is not None else None,
        nps_medio=round(m.nps_medio_produto, 2) if m.nps_medio_produto is not None else None,
        taxa_recomendacao=taxa_rec,
        
        total_tickets=m.total_tickets_produto if m.total_tickets_produto is not None else 0,

        # Novos campos da Gold
        peso_kg_produto=m.peso_kg_produto,
        status_estoque_produto=m.status_estoque_produto,
        data_cadastro_produto=m.data_cadastro_produto,
        data_primeira_venda=m.data_primeira_venda,
        data_ultima_venda=m.data_ultima_venda,
        pedidos_aprovados=m.pedidos_aprovados if m.pedidos_aprovados is not None else 0,
        pedidos_recusados=m.pedidos_recusados if m.pedidos_recusados is not None else 0,
        pedidos_processando=m.pedidos_processando if m.pedidos_processando is not None else 0,
        pedidos_reembolsados=m.pedidos_reembolsados if m.pedidos_reembolsados is not None else 0,
        tempo_medio_resolucao_produto=round(m.tempo_medio_resolucao_produto, 2) if m.tempo_medio_resolucao_produto is not None else None,
        total_eventos_produto=m.total_eventos_produto if m.total_eventos_produto is not None else 0,
        total_sessoes_produto=m.total_sessoes_produto if m.total_sessoes_produto is not None else 0,
        total_pageviews_produto=m.total_pageviews_produto if m.total_pageviews_produto is not None else 0,
        total_add_carrinho_produto=m.total_add_carrinho_produto if m.total_add_carrinho_produto is not None else 0,
        total_eventos_compra_produto=m.total_eventos_compra_produto if m.total_eventos_compra_produto is not None else 0,
        status_comercial_produto=m.status_comercial_produto or "Novo",
        produto_com_alto_volume_suporte=m.produto_com_alto_volume_suporte or False,
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
    """
    Lista produtos da camada Silver com apenas os campos cadastrais (sem as
    métricas agregadas). Endpoint mais leve que `GET /produtos/metricas`,
    útil quando o frontend precisa apenas dos dados de catálogo.
    """
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
    """
    Retorna os dados cadastrais de um produto (camada Silver). Retorna 404
    se o `produto_id` não existir.
    """
    produto = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.post(
    "/",
    response_model=ProdutoResponse,
    status_code=201,
    summary="Adiciona um novo produto",
    dependencies=[Depends(require_produtos_write)],
)
def adicionar_produto(prod_in: ProdutoCreate, db: Session = Depends(get_db)):
    """
    Cria um novo produto na camada Silver. As métricas Gold associadas só
    aparecerão após a próxima execução do pipeline de dados.
    """
    return create_produto(db, prod_in)


@router.put(
    "/{produto_id}",
    response_model=ProdutoResponse,
    summary="Edita um produto existente",
    dependencies=[Depends(require_produtos_write)],
)
def editar_produto(produto_id: str, prod_in: ProdutoUpdate, db: Session = Depends(get_db)):
    """
    Atualiza os dados cadastrais de um produto existente. Aceita atualizações
    parciais (PATCH-like) - apenas os campos enviados são modificados.
    """
    return update_produto(db, produto_id, prod_in)


@router.delete(
    "/{produto_id}",
    summary="Remove um produto",
    dependencies=[Depends(require_produtos_write)],
)
def remover_produto(produto_id: str, db: Session = Depends(get_db)):
    """
    Remove um produto da camada Silver. A remoção é hard delete; os registros
    históricos de vendas e avaliações associados permanecem no banco para fins
    de relatório.
    """
    delete_produto(db, produto_id)
    return {"message": "Produto removido com sucesso", "id_produto": produto_id}