# routes/export.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from bd.database import get_db
import csv
import io

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/clientes")
def export_clientes(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM dim_cliente"))
    columns = result.keys()
    rows = result.fetchall()
    return gerar_csv(rows, columns, "clientes.csv")


@router.get("/pedidos")
def export_pedidos(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM fato_vendas"))
    columns = result.keys()
    rows = result.fetchall()
    return gerar_csv(rows, columns, "pedidos.csv")


@router.get("/produtos")
def export_produtos(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM dim_produto"))
    columns = result.keys()
    rows = result.fetchall()
    return gerar_csv(rows, columns, "produtos.csv")


@router.get("/suporte")
def export_suporte(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM fato_suporte"))
    columns = result.keys()
    rows = result.fetchall()
    return gerar_csv(rows, columns, "suporte.csv")


@router.get("/avaliacoes")
def export_avaliacoes(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM fato_avaliacoes"))
    columns = result.keys()
    rows = result.fetchall()
    return gerar_csv(rows, columns, "avaliacoes.csv")


def gerar_csv(rows, columns, filename: str) -> StreamingResponse:
    if not rows:
        output = io.StringIO()
        output.seek(0)
        return StreamingResponse(output, media_type="text/csv")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(columns)
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )