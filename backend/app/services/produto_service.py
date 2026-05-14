from typing import Optional
from sqlalchemy import Float, cast, func, select
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import DimProduto, Pedidos, FatoAvaliacoes, FatoSuporte
from app.schemas import ProdutoMetricas, ProdutoCreate, ProdutoUpdate



def get_faixa_preco(price: Optional[float]) -> Optional[str]:
    if price is None:
        return None
    try:
        p = float(price)
        if p <= 50.0:
            return "baixo"
        elif p <= 150.0:
            return "medio"
        else:
            return "alto"
    except (ValueError, TypeError):
        return None


def create_produto(db: Session, prod_in: ProdutoCreate) -> DimProduto:
    id_val = prod_in.id_produto
    if not id_val:
        max_id = (
            db.query(DimProduto.id_produto)
            .filter(DimProduto.id_produto.like("PROD-%"))
            .order_by(DimProduto.id_produto.desc())
            .first()
        )
        if max_id:
            try:
                last_num = int(max_id[0].split("-")[1])
                id_val = f"PROD-{last_num + 1:04d}"
            except Exception:
                import uuid
                id_val = f"PROD-{str(uuid.uuid4())[:8].upper()}"
        else:
            id_val = "PROD-0001"
            
    # verificando se ja existe o produto
    existing_prod = db.query(DimProduto).filter(DimProduto.id_produto == id_val).first()
    if existing_prod:
        raise HTTPException(status_code=400, detail="ID de produto já cadastrado")

    db_prod = DimProduto(
        id_produto=id_val,
        nome_produto=prod_in.nome_produto,
        categoria_produto=prod_in.categoria_produto,
        preco_produto=prod_in.preco_produto,
        fornecedor_produto=prod_in.fornecedor_produto,
        estoque_produto=prod_in.estoque_produto,
        produto_ativo=prod_in.produto_ativo,
        faixa_preco=get_faixa_preco(prod_in.preco_produto)
    )
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)

    return db_prod


def update_produto(db: Session, produto_id: str, prod_in: ProdutoUpdate) -> DimProduto:
    db_prod = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    update_data = prod_in.model_dump(exclude_unset=True)
    update_data.pop("peso_kg_produto", None)

    for field, value in update_data.items():
        if hasattr(db_prod, field):
            setattr(db_prod, field, value)

    if "preco_produto" in update_data:
        db_prod.faixa_preco = get_faixa_preco(db_prod.preco_produto)

    db.commit()
    db.refresh(db_prod)

    return db_prod


def delete_produto(db: Session, produto_id: str) -> bool:
    db_prod = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Regra de Integridade de Negócios: Não permite deletar produtos ativos
    if db_prod.produto_ativo:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir um produto que está ativo. Por favor, desative-o antes de prosseguir com a exclusão."
        )
    
    db.delete(db_prod)
    db.commit()

    return True



def build_product_metric_subqueries():
    sq_vendas = (
        select(
            Pedidos.id_produto,
            func.count(Pedidos.id_pedido).label("total_pedidos"),
            func.coalesce(func.sum(Pedidos.quantidade_produto), 0).label("quantidade_vendida"),
            func.coalesce(func.sum(Pedidos.valor_pedido), 0.0).label("receita_total"),
            func.avg(Pedidos.valor_pedido).label("ticket_medio"),
        )
        .group_by(Pedidos.id_produto)
        .subquery()
    )

    sq_avaliacoes = (
        select(
            FatoAvaliacoes.id_produto,
            func.count(FatoAvaliacoes.id_avaliacao).label("total_avaliacoes"),
            func.avg(FatoAvaliacoes.nota_produto).label("nota_media"),
            func.avg(FatoAvaliacoes.nota_nps).label("nps_medio"),
            (func.avg(cast(FatoAvaliacoes.recomenda_produto, Float)) * 100).label("taxa_recomendacao"),
        )
        .group_by(FatoAvaliacoes.id_produto)
        .subquery()
    )

    sq_suporte = (
        select(
            Pedidos.id_produto,
            func.count(func.distinct(FatoSuporte.ticket_id)).label("total_tickets"),
        )
        .outerjoin(FatoSuporte, Pedidos.id_pedido == FatoSuporte.id_pedido)
        .group_by(Pedidos.id_produto)
        .subquery()
    )

    return sq_vendas, sq_avaliacoes, sq_suporte


def map_row_to_product_metric_schema(r) -> ProdutoMetricas:
    return ProdutoMetricas(
        id_produto=r.id_produto,
        nome_produto=r.nome_produto,
        categoria_produto=r.categoria_produto,
        preco_produto=r.preco_produto,
        faixa_preco=r.faixa_preco,
        estoque_produto=r.estoque_produto,
        produto_ativo=r.produto_ativo,
        fornecedor_produto=r.fornecedor_produto,
        total_pedidos=r.total_pedidos or 0,
        quantidade_vendida=r.quantidade_vendida or 0,
        receita_total=r.receita_total or 0.0,
        ticket_medio=round(r.ticket_medio, 2) if r.ticket_medio is not None else None,
        total_avaliacoes=r.total_avaliacoes or 0,
        nota_media=round(r.nota_media, 2) if r.nota_media is not None else None,
        nps_medio=round(r.nps_medio, 2) if r.nps_medio is not None else None,
        taxa_recomendacao=round(r.taxa_recomendacao, 2) if r.taxa_recomendacao is not None else None,
        total_tickets=r.total_tickets or 0,
    )
