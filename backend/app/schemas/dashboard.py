from pydantic import BaseModel


class DashboardKPIsOut(BaseModel):
    totalRevenue: float
    totalSales: int
    totalCustomers: int
    averageOrderValue: float
