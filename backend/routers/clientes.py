from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List

from database import get_db
from models import Cliente, Pedidos, FatoSuporte
from schemas import ClienteResponse, ClienteHistoricoResponse, PedidoListItem, TicketListItem

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(

    # Filtros: Filtrar por nome, sobrenome, email, cidade, estado, país, genero, ...
    nome: Optional[str] = Query(None, description="Filtrar por nome"),
    sobrenome: Optional[str] = Query(
        None, description="Filtrar por sobrenome"),
    email: Optional[str] = Query(None, description="Filtrar por email"),
    cidade: Optional[str] = Query(None, description="Filtrar por cidade"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    pais: Optional[str] = Query(None, description="Filtrar por país"),
    genero: Optional[str] = Query(
        None, description="Filtrar por gênero (M/F)"),
    origem: Optional[str] = Query(
        None, description="Filtrar por origem (Web/App/Indicação)"),
    idade_min: Optional[int] = Query(None, description="Idade mínima"),
    idade_max: Optional[int] = Query(None, description="Idade máxima"),
    busca: Optional[str] = Query(
        None, description="Busca geral: nome, sobrenome ou email"),
    skip: int = Query(0, ge=0, description="Registros para pular (paginação)"),
    limit: int = Query(
        50, ge=1, le=500, description="Limite de registros (paginação)"),
    db: Session = Depends(get_db),
):
    query = db.query(Cliente)

    # Busca geral (nome, sobrenome ou email)
    if busca:
        query = query.filter(
            or_(
                Cliente.nome_cliente.ilike(f"%{busca}%"),
                Cliente.sobrenome_cliente.ilike(f"%{busca}%"),
                Cliente.email_cliente.ilike(f"%{busca}%"),
            )
        )

    # Filtros específicos
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


# Buscar um cliente especifico via Id
@router.get("/{cliente_id}", response_model=ClienteResponse)
def buscar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(
        Cliente.id_cliente == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@router.get("/{cliente_id}/historico", response_model=ClienteHistoricoResponse)
def buscar_historico_cliente(cliente_id: str, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(
        Cliente.id_cliente == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

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

    return ClienteHistoricoResponse(
        cliente=cliente,
        total_pedidos=int(total_pedidos),
        valor_total=float(valor_total),
        total_tickets=int(total_tickets),
        tickets_abertos=int(tickets_abertos),
        pedidos=pedidos,
        tickets=tickets,
    )
