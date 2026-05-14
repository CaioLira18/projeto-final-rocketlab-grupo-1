from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import VendasPeriodo, Cliente360


def calculate_dashboard_kpis(db: Session):
    print("[DB] Calculando KPIs do dashboard (app_gold.db)...")
    total_revenue = db.query(func.sum(VendasPeriodo.receita_total)).scalar() or 0.0
    total_sales = db.query(func.sum(VendasPeriodo.total_pedidos)).scalar() or 0
    total_customers = db.query(func.count(Cliente360.id_cliente)).scalar() or 0

    average_order_value = total_revenue / total_sales if total_sales > 0 else 0.0

    # aqui eu estou pegando as vendas por mes
    monthly_data = (
        db.query(
            VendasPeriodo.mes_referencia,
            func.sum(VendasPeriodo.receita_total).label("receita"),
            func.sum(VendasPeriodo.total_pedidos).label("pedidos")
        )
        .group_by(VendasPeriodo.ano_pedido, VendasPeriodo.mes_pedido, VendasPeriodo.mes_referencia)
        .order_by(VendasPeriodo.ano_pedido.asc(), VendasPeriodo.mes_pedido.asc())
        .all()
    )

    monthly_sales = [
        {
            "mes_referencia": str(r.mes_referencia),
            "receita": float(r.receita or 0.0),
            "pedidos": int(r.pedidos or 0)
        } for r in monthly_data
    ]

    # aqui eu estou pegando as vendas por categoria de produto
    category_data = (
        db.query(
            VendasPeriodo.categoria_produto,
            func.sum(VendasPeriodo.receita_total).label("receita"),
            func.sum(VendasPeriodo.total_pedidos).label("pedidos")
        )
        .filter(VendasPeriodo.categoria_produto.isnot(None))
        .group_by(VendasPeriodo.categoria_produto)
        .order_by(func.sum(VendasPeriodo.receita_total).desc())
        .all()
    )

    category_sales = [
        {
            "categoria": str(r.categoria_produto),
            "receita": float(r.receita or 0.0),
            "pedidos": int(r.pedidos or 0)
        } for r in category_data
    ]

    # aqui eu estou pegando as vendas por estado
    state_data = (
        db.query(
            VendasPeriodo.estado_cliente,
            func.sum(VendasPeriodo.receita_total).label("receita"),
            func.sum(VendasPeriodo.total_clientes).label("clientes")
        )
        .filter(VendasPeriodo.estado_cliente.isnot(None))
        .group_by(VendasPeriodo.estado_cliente)
        .order_by(func.sum(VendasPeriodo.receita_total).desc())
        .limit(10)
        .all()
    )

    state_sales = [
        {
            "estado": str(r.estado_cliente),
            "receita": float(r.receita or 0.0),
            "clientes": int(r.clientes or 0)
        } for r in state_data
    ]

    # aqui eu estou pegando as vendas por metodo de pagamento
    payment_data = (
        db.query(
            VendasPeriodo.metodo_pagamento,
            func.sum(VendasPeriodo.receita_total).label("receita"),
            func.sum(VendasPeriodo.total_pedidos).label("pedidos")
        )
        .filter(VendasPeriodo.metodo_pagamento.isnot(None))
        .group_by(VendasPeriodo.metodo_pagamento)
        .order_by(func.sum(VendasPeriodo.receita_total).desc())
        .all()
    )

    payment_sales = [
        {
            "metodo": str(r.metodo_pagamento),
            "receita": float(r.receita or 0.0),
            "pedidos": int(r.pedidos or 0)
        } for r in payment_data
    ]

    # aqui eu estou pegando as vendas por segmento de valor do cliente
    segment_data = (
        db.query(
            Cliente360.faixa_valor_cliente,
            func.count(Cliente360.id_cliente).label("quantidade")
        )
        .filter(Cliente360.faixa_valor_cliente.isnot(None))
        .group_by(Cliente360.faixa_valor_cliente)
        .order_by(func.count(Cliente360.id_cliente).desc())
        .all()
    )

    customer_segments = [
        {
            "faixa": str(r.faixa_valor_cliente),
            "quantidade": int(r.quantidade or 0)
        } for r in segment_data
    ]

    result = {
        "totalRevenue": float(total_revenue),
        "totalSales": int(total_sales),
        "totalCustomers": int(total_customers),
        "averageOrderValue": float(average_order_value),
        "monthlySales": monthly_sales,
        "categorySales": category_sales,
        "stateSales": state_sales,
        "paymentSales": payment_sales,
        "customerSegments": customer_segments
    }
    return result


