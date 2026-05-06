from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from database import get_db
from models import Cliente, Pedidos
from schemas import DashboardKPIsOut

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis", summary="Retorna os principais KPIs de Vendas e Clientes", response_model=DashboardKPIsOut)
def get_kpis(db: Session = Depends(get_db)):
    # Receita Total
    total_revenue = db.query(func.sum(Pedidos.valor_pedido)).scalar() or 0.0
    
    # Total de Vendas (Quantidade de pedidos)
    total_sales = db.query(func.count(Pedidos.id_pedido)).scalar() or 0
    
    # Total de Clientes Cadastrados
    total_customers = db.query(func.count(Cliente.id_cliente)).scalar() or 0
    
    # Ticket Médio (Average Order Value)
    average_order_value = total_revenue / total_sales if total_sales > 0 else 0.0

    return {
        "totalRevenue": float(total_revenue),
        "totalSales": int(total_sales),
        "totalCustomers": int(total_customers),
        "averageOrderValue": float(average_order_value)
    }
