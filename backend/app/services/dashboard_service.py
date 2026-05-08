from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import VendasPeriodoGold, Cliente360Gold


def calculate_dashboard_kpis(db: Session):
    total_revenue = db.query(func.sum(VendasPeriodoGold.receita_total)).scalar() or 0.0
    total_sales = db.query(func.sum(VendasPeriodoGold.total_pedidos)).scalar() or 0
    total_customers = db.query(func.count(Cliente360Gold.id_cliente)).scalar() or 0

    average_order_value = total_revenue / total_sales if total_sales > 0 else 0.0

    return {
        "totalRevenue": float(total_revenue),
        "totalSales": int(total_sales),
        "totalCustomers": int(total_customers),
        "averageOrderValue": float(average_order_value)
    }
