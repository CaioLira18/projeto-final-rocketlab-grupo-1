from pydantic import BaseModel
from typing import List, Optional


class MonthlySales(BaseModel):
    mes_referencia: str
    receita: float
    pedidos: int


class CategorySales(BaseModel):
    categoria: str
    receita: float
    pedidos: int


class StateSales(BaseModel):
    estado: str
    receita: float
    clientes: int


class PaymentMethodSales(BaseModel):
    metodo: str
    receita: float
    pedidos: int


class CustomerSegment(BaseModel):
    faixa: str
    quantidade: int


class DashboardKPIsOut(BaseModel):
    totalRevenue: float
    totalSales: int
    totalCustomers: int
    averageOrderValue: float
    monthlySales: List[MonthlySales]
    categorySales: List[CategorySales]
    stateSales: List[StateSales]
    paymentSales: List[PaymentMethodSales]
    customerSegments: List[CustomerSegment]

