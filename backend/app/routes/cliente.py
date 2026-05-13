from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from bd.database import get_db
from app.schemas import ClienteResponse, ClienteHistoricoResponse
from app.services import list_clientes, get_cliente_by_id, get_cliente_historico
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False,
)


@router.get("/")
def listar_clientes(
    nome: Optional[str] = Query(None),
    sobrenome: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    cidade: Optional[List[str]] = Query(None),   # FIX: era str, agora List[str] igual aos outros
    estado: Optional[List[str]] = Query(None),
    pais: Optional[str] = Query(None),
    genero: Optional[List[str]] = Query(None),
    origem: Optional[List[str]] = Query(None),
    idade_min: Optional[int] = Query(None),
    idade_max: Optional[int] = Query(None),
    ramal: Optional[str] = Query(None),
    sem_ramal: Optional[bool] = Query(None),     # FIX: parâmetro sem_ramal adicionado
    busca: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    clientes = list_clientes(
        db=db,
        nome=nome,
        sobrenome=sobrenome,
        email=email,
        cidade=cidade,
        estado=estado,
        pais=pais,
        genero=genero,
        origem=origem,
        ramal=ramal,
        sem_ramal=sem_ramal,                     # FIX: repassado para o service
        idade_min=idade_min,
        idade_max=idade_max,
        busca=busca,
        skip=skip,
        limit=limit,
    )

    # conta o total com os mesmos filtros (sem paginação)
    from app.models import Cliente as ClienteModel
    from sqlalchemy import or_

    query = db.query(ClienteModel)

    if busca:
        query = query.filter(
            or_(
                ClienteModel.nome_cliente.ilike(f"%{busca}%"),
                ClienteModel.sobrenome_cliente.ilike(f"%{busca}%"),
                ClienteModel.email_cliente.ilike(f"%{busca}%"),
            )
        )
    if nome:
        query = query.filter(ClienteModel.nome_cliente.ilike(f"%{nome}%"))
    if sobrenome:
        query = query.filter(ClienteModel.sobrenome_cliente.ilike(f"%{sobrenome}%"))
    if email:
        query = query.filter(ClienteModel.email_cliente.ilike(f"%{email}%"))
    if cidade:
        query = query.filter(ClienteModel.cidade_cliente.in_(cidade))  # FIX: .in_() para lista
    if pais:
        query = query.filter(ClienteModel.pais_cliente.ilike(f"%{pais}%"))
    if estado:
        query = query.filter(ClienteModel.estado_cliente.in_(estado))
    if genero:
        query = query.filter(ClienteModel.genero_cliente.in_(genero))
    if origem:
        query = query.filter(ClienteModel.origem_cliente.in_(origem))
    if idade_min is not None:
        query = query.filter(ClienteModel.idade >= idade_min)
    if idade_max is not None:
        query = query.filter(ClienteModel.idade <= idade_max)
    # FIX: sem_ramal e ramal mutuamente exclusivos na contagem também
    if sem_ramal:
        query = query.filter(
            (ClienteModel.ramal_cliente == None) |
            (ClienteModel.ramal_cliente == "") |
            (ClienteModel.ramal_cliente == "0")
        )
    elif ramal:
        query = query.filter(ClienteModel.ramal_cliente.ilike(f"%{ramal}%"))

    total = query.count()

    return {
        "clientes": clientes,
        "total": total,
    }

@router.get("/teste")
def teste(db: Session = Depends(get_db)):
    print(db.bind.url)

    from app.models import Cliente as ClienteModel

    cliente = db.query(ClienteModel).first()

    return cliente.__dict__

@router.get("/{cliente_id}", response_model=ClienteResponse)
def buscar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    return get_cliente_by_id(db, cliente_id)


@router.get("/{cliente_id}/historico", response_model=ClienteHistoricoResponse)
def buscar_historico_cliente(cliente_id: str, db: Session = Depends(get_db)):
    return get_cliente_historico(db, cliente_id)
