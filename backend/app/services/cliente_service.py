from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models import Cliente, Pedidos, FatoSuporte
from fastapi import HTTPException


def list_clientes(
    db: Session,
    nome=None, sobrenome=None, email=None, cidade=None, estado=None, pais=None,
    genero=None, origem=None, idade_min=None, idade_max=None, busca=None,
    skip=0, limit=50
):
    query = db.query(Cliente)

    if busca:
        query = query.filter(
            or_(
                Cliente.nome_cliente.ilike(f"%{busca}%"),
                Cliente.sobrenome_cliente.ilike(f"%{busca}%"),
                Cliente.email_cliente.ilike(f"%{busca}%"),
            )
        )

    if nome:
        query = query.filter(Cliente.nome_cliente.ilike(f"%{nome}%"))
    if sobrenome:
        query = query.filter(Cliente.sobrenome_cliente.ilike(f"%{sobrenome}%"))
    if email:
        query = query.filter(Cliente.email_cliente.ilike(f"%{email}%"))
    if cidade:
        query = query.filter(Cliente.cidade_cliente.ilike(f"%{cidade}%"))
    if estado:
        query = query.filter(Cliente.estado_cliente.ilike(f"%{estado}%"))
    if pais:
        query = query.filter(Cliente.pais_cliente.ilike(f"%{pais}%"))
    if genero:
        query = query.filter(Cliente.genero_cliente == genero)
    if origem:
        query = query.filter(Cliente.origem_cliente == origem)
    if idade_min is not None:
        query = query.filter(Cliente.idade >= idade_min)
    if idade_max is not None:
        query = query.filter(Cliente.idade <= idade_max)

    return query.offset(skip).limit(limit).all()


def get_cliente_by_id(db: Session, cliente_id: str):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


def get_cliente_historico(db: Session, cliente_id: str):
    cliente = get_cliente_by_id(db, cliente_id)

    total_pedidos = db.query(func.count(Pedidos.id_pedido)).filter(
        Pedidos.id_cliente == cliente_id).scalar() or 0
    valor_total = db.query(func.coalesce(func.sum(Pedidos.valor_pedido), 0.0)).filter(
        Pedidos.id_cliente == cliente_id).scalar() or 0.0
    total_tickets = db.query(func.count(FatoSuporte.ticket_id)).filter(
        FatoSuporte.id_cliente == cliente_id).scalar() or 0
    tickets_abertos = db.query(func.count(FatoSuporte.ticket_id)).filter(
        FatoSuporte.id_cliente == cliente_id,
        or_(FatoSuporte.data_resolucao == None,
            FatoSuporte.data_resolucao == ""),
    ).scalar() or 0

    pedidos = (
        db.query(Pedidos)
        .filter(Pedidos.id_cliente == cliente_id)
        .order_by(Pedidos.data_pedido.desc())
        .all()
    )
    tickets = (
        db.query(FatoSuporte)
        .filter(FatoSuporte.id_cliente == cliente_id)
        .order_by(FatoSuporte.data_abertura.desc())
        .all()
    )

    return {
        "cliente": cliente,
        "total_pedidos": int(total_pedidos),
        "valor_total": float(valor_total),
        "total_tickets": int(total_tickets),
        "tickets_abertos": int(tickets_abertos),
        "pedidos": pedidos,
        "tickets": tickets,
    }
