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

    # --- SINCRONIZAÇÃO EM TEMPO REAL COM A CAMADA GOLD ---
    from bd.database import SessionGold
    from app.models import ProdutoGold, Produto360
    from datetime import datetime

    db_gold = SessionGold()
    try:
        faixa = get_faixa_preco(db_prod.preco_produto)
        status_estoque = "Critico"
        if db_prod.estoque_produto is not None:
            if db_prod.estoque_produto > 50:
                status_estoque = "Excelente"
            elif db_prod.estoque_produto > 15:
                status_estoque = "Alerta"

        peso_val = prod_in.peso_kg_produto if prod_in.peso_kg_produto is not None else 1.0

        # 1. Salva na dim_produto da Gold (ProdutoGold)
        gold_prod = ProdutoGold(
            id_produto=db_prod.id_produto,
            nome_produto=db_prod.nome_produto,
            categoria_produto=db_prod.categoria_produto,
            preco_produto=db_prod.preco_produto,
            fornecedor_produto=db_prod.fornecedor_produto,
            peso_kg_produto=peso_val,
            estoque_produto=db_prod.estoque_produto,
            produto_ativo=db_prod.produto_ativo,
            data_cadastro_produto=datetime.now().strftime("%Y-%m-%d"),
            faixa_preco_produto=faixa,
            status_estoque_produto=status_estoque
        )
        db_gold.add(gold_prod)

        # 2. Salva na dm_produto_360 da Gold (Produto360) com métricas iniciais vazias
        gold_360 = Produto360(
            id_produto=db_prod.id_produto,
            nome_produto=db_prod.nome_produto,
            categoria_produto=db_prod.categoria_produto,
            preco_produto=db_prod.preco_produto,
            fornecedor_produto=db_prod.fornecedor_produto,
            peso_kg_produto=peso_val,
            estoque_produto=db_prod.estoque_produto,
            produto_ativo=db_prod.produto_ativo,
            data_cadastro_produto=datetime.now().strftime("%Y-%m-%d"),
            faixa_preco_produto=faixa,
            status_estoque_produto=status_estoque,
            total_pedidos=0,
            quantidade_vendida=0,
            receita_total_produto=0.0,
            ticket_medio_produto=0.0,
            pedidos_aprovados=0,
            pedidos_recusados=0,
            pedidos_processando=0,
            pedidos_reembolsados=0,
            total_avaliacoes=0,
            nota_media_produto=None,
            nps_medio_produto=None,
            taxa_recomendacao_produto=None,
            total_tickets_produto=0,
            tempo_medio_resolucao_produto=None,
            total_eventos_produto=0,
            total_sessoes_produto=0,
            total_pageviews_produto=0,
            total_add_carrinho_produto=0,
            total_eventos_compra_produto=0,
            status_comercial_produto="Novo",
            produto_com_alto_volume_suporte=False
        )
        db_gold.add(gold_360)
        db_gold.commit()
    except Exception as e:
        db_gold.rollback()
        print(f"[WARN] Erro ao sincronizar criação do produto na camada Gold: {e}")
    finally:
        db_gold.close()

    return db_prod


def update_produto(db: Session, produto_id: str, prod_in: ProdutoUpdate) -> DimProduto:
    db_prod = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    update_data = prod_in.model_dump(exclude_unset=True)
    peso_val_update = update_data.get("peso_kg_produto")

    for field, value in update_data.items():
        if hasattr(db_prod, field):
            setattr(db_prod, field, value)

    if "preco_produto" in update_data:
        db_prod.faixa_preco = get_faixa_preco(db_prod.preco_produto)

    db.commit()
    db.refresh(db_prod)

    # --- SINCRONIZAÇÃO EM TEMPO REAL COM A CAMADA GOLD ---
    from bd.database import SessionGold
    from app.models import ProdutoGold, Produto360

    db_gold = SessionGold()
    try:
        faixa = get_faixa_preco(db_prod.preco_produto)
        status_estoque = "Critico"
        if db_prod.estoque_produto is not None:
            if db_prod.estoque_produto > 50:
                status_estoque = "Excelente"
            elif db_prod.estoque_produto > 15:
                status_estoque = "Alerta"

        # 1. Atualiza dim_produto na Gold
        gold_prod = db_gold.query(ProdutoGold).filter(ProdutoGold.id_produto == produto_id).first()
        if gold_prod:
            gold_prod.nome_produto = db_prod.nome_produto
            gold_prod.categoria_produto = db_prod.categoria_produto
            gold_prod.preco_produto = db_prod.preco_produto
            gold_prod.fornecedor_produto = db_prod.fornecedor_produto
            gold_prod.estoque_produto = db_prod.estoque_produto
            gold_prod.produto_ativo = db_prod.produto_ativo
            gold_prod.faixa_preco_produto = faixa
            gold_prod.status_estoque_produto = status_estoque
            if peso_val_update is not None:
                gold_prod.peso_kg_produto = peso_val_update

        # 2. Atualiza dm_produto_360 na Gold
        gold_360 = db_gold.query(Produto360).filter(Produto360.id_produto == produto_id).first()
        if gold_360:
            gold_360.nome_produto = db_prod.nome_produto
            gold_360.categoria_produto = db_prod.categoria_produto
            gold_360.preco_produto = db_prod.preco_produto
            gold_360.fornecedor_produto = db_prod.fornecedor_produto
            gold_360.estoque_produto = db_prod.estoque_produto
            gold_360.produto_ativo = db_prod.produto_ativo
            gold_360.faixa_preco_produto = faixa
            gold_360.status_estoque_produto = status_estoque
            if peso_val_update is not None:
                gold_360.peso_kg_produto = peso_val_update

        db_gold.commit()
    except Exception as e:
        db_gold.rollback()
        print(f"[WARN] Erro ao sincronizar atualizações do produto na camada Gold: {e}")
    finally:
        db_gold.close()

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

    # --- SINCRONIZAÇÃO EM TEMPO REAL COM A CAMADA GOLD ---
    from bd.database import SessionGold
    from app.models import ProdutoGold, Produto360

    db_gold = SessionGold()
    try:
        # 1. Remove da dim_produto da Gold
        gold_prod = db_gold.query(ProdutoGold).filter(ProdutoGold.id_produto == produto_id).first()
        if gold_prod:
            db_gold.delete(gold_prod)

        # 2. Remove da dm_produto_360 da Gold
        gold_360 = db_gold.query(Produto360).filter(Produto360.id_produto == produto_id).first()
        if gold_360:
            db_gold.delete(gold_360)

        db_gold.commit()
    except Exception as e:
        db_gold.rollback()
        print(f"[WARN] Erro ao sincronizar remoção do produto na camada Gold: {e}")
    finally:
        db_gold.close()

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
