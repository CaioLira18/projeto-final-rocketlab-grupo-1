from sqlalchemy import case, func
from sqlalchemy.orm import Session
from app.models import DimProduto, FatoSuporte, Pedidos
from app.schemas.suporte import SuporteTicketItem, SuporteMetricasProduto


# Coluna de status baseada na data de resolução do ticket
def build_status_col():
    return case(
        (FatoSuporte.data_resolucao == None, "aberto"),
        else_="resolvido",
    ).label("status")


# Consulta base com join para Pedidos e coluna de status
def build_suporte_base_query(db: Session):
    return (
        db.query(
            FatoSuporte.ticket_id,
            FatoSuporte.id_cliente,
            FatoSuporte.nome_cliente,
            FatoSuporte.id_pedido,
            FatoSuporte.data_pedido,
            FatoSuporte.tipo_problema,
            FatoSuporte.data_abertura,
            FatoSuporte.data_resolucao,
            FatoSuporte.tempo_resolucao_horas,
            FatoSuporte.agente_suporte,
            Pedidos.id_produto,
            Pedidos.nome_produto,
            Pedidos.categoria_produto,
            build_status_col(),
        )
        .outerjoin(Pedidos, FatoSuporte.id_pedido == Pedidos.id_pedido)  # Trará todos os tickets, mesmo sem pedido correspondente
    )


# Converte o resultado da query em um schema de resposta
def map_row_to_ticket_schema(r) -> SuporteTicketItem:
    return SuporteTicketItem(
        ticket_id=r.ticket_id,
        id_cliente=r.id_cliente,
        nome_cliente=r.nome_cliente,
        id_pedido=r.id_pedido,
        id_produto=r.id_produto,
        nome_produto=r.nome_produto,
        categoria_produto=r.categoria_produto,
        data_pedido=r.data_pedido,
        tipo_problema=r.tipo_problema,
        data_abertura=r.data_abertura,
        data_resolucao=r.data_resolucao,
        tempo_resolucao_horas=round(r.tempo_resolucao_horas, 2) if r.tempo_resolucao_horas is not None else None,
        agente_suporte=r.agente_suporte,
        status=r.status,
    )


# Calcula métricas agregadas de suporte para um produto específico
def get_metricas_by_produto(db: Session, produto_id: str) -> SuporteMetricasProduto:
    produto = db.query(DimProduto).filter(DimProduto.id_produto == produto_id).first()

    resultado = (
        db.query(
            func.count(FatoSuporte.ticket_id).label("total_tickets"),
            func.sum(case((FatoSuporte.data_resolucao == None, 1), else_=0)).label("tickets_abertos"),
            func.sum(case((FatoSuporte.data_resolucao != None, 1), else_=0)).label("tickets_resolvidos"),
            func.avg(FatoSuporte.tempo_resolucao_horas).label("tempo_resolucao_medio"),
        )
        .join(Pedidos, FatoSuporte.id_pedido == Pedidos.id_pedido)
        .filter(Pedidos.id_produto == produto_id)
        .first()
    )

    total = resultado.total_tickets or 0
    resolvidos = resultado.tickets_resolvidos or 0
    taxa = round((resolvidos / total) * 100, 2) if total > 0 else None

    return SuporteMetricasProduto(
        id_produto=produto_id,
        nome_produto=produto.nome_produto,
        categoria_produto=produto.categoria_produto,
        total_tickets=total,
        tickets_abertos=resultado.tickets_abertos or 0,
        tickets_resolvidos=resolvidos,
        tempo_resolucao_medio=round(resultado.tempo_resolucao_medio, 2) if resultado.tempo_resolucao_medio else None,
        taxa_resolucao=taxa,
    )