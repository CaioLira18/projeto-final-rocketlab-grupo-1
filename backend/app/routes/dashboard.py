from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from app.schemas.dashboard import DashboardKPIsOut
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis", summary="Retorna os principais KPIs de Vendas e Clientes", response_model=DashboardKPIsOut)
def get_kpis(db: Session = Depends(get_db)):
    return DashboardService.get_kpis(db)
