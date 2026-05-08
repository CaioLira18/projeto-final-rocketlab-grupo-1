from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bd.database import get_db
from app.schemas import DashboardKPIsOut
from app.services import calculate_dashboard_kpis

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", summary="Retorna os principais KPIs de Vendas e Clientes", response_model=DashboardKPIsOut)
def get_kpis(db: Session = Depends(get_db)):
    return calculate_dashboard_kpis(db)
