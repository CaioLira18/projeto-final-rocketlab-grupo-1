from sqlalchemy import Float, cast, func, select
from app.models import Pedidos, FatoAvaliacoes, FatoSuporte
from app.schemas import ProdutoMetricas


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
