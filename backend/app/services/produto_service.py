from sqlalchemy import Float, cast, func, select
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.produto import DimProduto
from app.models.avaliacao import FatoAvaliacoes
from app.models.suporte import FatoSuporte
from app.models.pedido import Pedidos
from app.schemas.produto import ProdutoMetricas

class ProdutoService:
    @staticmethod
    def _build_subqueries():
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

    @staticmethod
    def _row_to_schema(r) -> ProdutoMetricas:
        # Calcula a faixa de preço dinamicamente a partir do preço do produto
        if r.preco_produto is None:
            faixa_preco = None
        elif r.preco_produto < 50:
            faixa_preco = 'baixo'
        elif r.preco_produto < 200:
            faixa_preco = 'medio'
        else:
            faixa_preco = 'alto'

        return ProdutoMetricas(
            id_produto=r.id_produto,
            nome_produto=r.nome_produto,
            categoria_produto=r.categoria_produto,
            preco_produto=r.preco_produto,
            faixa_preco=faixa_preco,
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

    @classmethod
    def listar_metricas_produtos(
        cls,
        db: Session,
        categoria: Optional[str] = None,
        faixa_preco: Optional[str] = None,
        produto_ativo: Optional[bool] = None,
        busca: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ProdutoMetricas]:
        sq_vendas, sq_avaliacoes, sq_suporte = cls._build_subqueries()

        query = (
            db.query(
                DimProduto.id_produto,
                DimProduto.nome_produto,
                DimProduto.categoria_produto,
                DimProduto.preco_produto,
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
            if faixa_preco == 'baixo':
                query = query.filter(DimProduto.preco_produto < 50)
            elif faixa_preco == 'medio':
                query = query.filter(DimProduto.preco_produto >= 50, DimProduto.preco_produto < 200)
            elif faixa_preco == 'alto':
                query = query.filter(DimProduto.preco_produto >= 200)
        if produto_ativo is not None:
            query = query.filter(DimProduto.produto_ativo == produto_ativo)

        return [cls._row_to_schema(r) for r in query.offset(skip).limit(limit).all()]

    @classmethod
    def buscar_metricas_produto(cls, db: Session, produto_id: str) -> Optional[ProdutoMetricas]:
        sq_vendas, sq_avaliacoes, sq_suporte = cls._build_subqueries()

        resultado = (
            db.query(
                DimProduto.id_produto,
                DimProduto.nome_produto,
                DimProduto.categoria_produto,
                DimProduto.preco_produto,
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
            return None

        return cls._row_to_schema(resultado)
