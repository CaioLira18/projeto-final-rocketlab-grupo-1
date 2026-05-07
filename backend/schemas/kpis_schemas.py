from pydantic import BaseModel
from typing import Optional
from datetime import date


class DashboardKPIsOut(BaseModel):
    totalRevenue: float
    totalSales: int
    totalCustomers: int
    averageOrderValue: float