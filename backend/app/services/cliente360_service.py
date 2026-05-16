# app/services/cliente360_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.cliente_360 import Cliente360  # ajuste o import conforme seu projeto


def get_cliente_360(db: Session, cliente_id: str) -> Cliente360:
    cliente = (
        db.query(Cliente360)
        .filter(Cliente360.id_cliente == cliente_id)
        .first()
    )
    if not cliente:
        raise HTTPException(
            status_code=404,
            detail=f"Visão 360 não encontrada para o cliente {cliente_id}",
        )
    return cliente
