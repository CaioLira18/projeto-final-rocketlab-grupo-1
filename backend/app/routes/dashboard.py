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
    """
    Retorna os KPIs consolidados da camada Gold que alimentam o dashboard
    principal: receita total, ticket médio, total de clientes, pedidos por
    status, NPS médio, top produtos/categorias, entre outros.

    O resultado é cacheado em memória para reduzir custo de consulta. Use
    `sync=true` para forçar a recalculação a partir do banco (útil após o
    pipeline de dados rodar e atualizar as tabelas Gold).
    """
    return calculate_dashboard_kpis(db, sync=sync)
