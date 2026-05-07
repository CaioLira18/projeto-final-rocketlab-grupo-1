from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.models.cliente import Cliente
from app.models.pedido import Pedidos

class DashboardService:
    @staticmethod
    def get_kpis(db: Session) -> Dict[str, Any]:
        total_revenue = db.query(func.sum(Pedidos.valor_pedido)).scalar() or 0.0
        total_sales = db.query(func.count(Pedidos.id_pedido)).scalar() or 0
        total_customers = db.query(func.count(Cliente.id_cliente)).scalar() or 0
        
        average_order_value = total_revenue / total_sales if total_sales > 0 else 0.0

        return {
            "totalRevenue": float(total_revenue),
            "totalSales": int(total_sales),
            "totalCustomers": int(total_customers),
            "averageOrderValue": float(average_order_value)
        }
