from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from bd.database import get_db_gold
from app.schemas import DashboardKPIsOut
from app.services import calculate_dashboard_kpis
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/kpis", summary="Retorna os principais KPIs de Vendas e Clientes", response_model=DashboardKPIsOut)
def get_kpis(sync: bool = Query(False, description="Força a recalculação dos KPIs, ignorando o cache"), db: Session = Depends(get_db_gold)):
    return calculate_dashboard_kpis(db, sync=sync)
