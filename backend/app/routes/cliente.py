from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.services.cliente360_service import get_cliente_360

from bd.database import get_db, get_db_gold
from app.schemas import ClienteResponse, ClienteHistoricoResponse, Cliente360Response
from app.services import list_clientes, get_cliente_by_id, get_cliente_historico
from app.routes.dependencies import require_clientes_read, require_cliente_360


router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(require_clientes_read)],
    redirect_slashes=False,
)


@router.get("/", summary="Lista clientes com filtros e paginação")
def listar_clientes(
    id_cliente: Optional[str] = Query(None),
    nome: Optional[str] = Query(None),
    sobrenome: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    cidade: Optional[List[str]] = Query(None),
    estado: Optional[List[str]] = Query(None),
    pais: Optional[str] = Query(None),
    genero: Optional[List[str]] = Query(None),
    origem: Optional[List[str]] = Query(None),
    idade_min: Optional[int] = Query(None),
    idade_max: Optional[int] = Query(None),
    ramal: Optional[str] = Query(None),
    sem_ramal: Optional[bool] = Query(None),
    busca: Optional[str] = Query(None),
    ano_cadastro: Optional[List[int]] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Lista clientes da base com filtros opcionais (nome, e-mail, gênero, estado,
    origem, faixa de idade, ramal etc.) e paginação por `skip`/`limit`.

    O parâmetro `busca` aplica match parcial em `nome`, `sobrenome` e `email`
    simultaneamente, usado pelo campo de busca livre do frontend. Os filtros
    de lista (`cidade`, `estado`, `genero`, `origem`) aceitam múltiplos valores.

    Retorna `{ clientes: [...], total: N }`, onde `total` reflete a contagem
    com os filtros aplicados (independente de paginação).
    """
    clientes = list_clientes(
        db=db,
        id_cliente=id_cliente,
        nome=nome,
        sobrenome=sobrenome,
        email=email,
        cidade=cidade,
        estado=estado,
        pais=pais,
        genero=genero,
        origem=origem,
        ramal=ramal,
        sem_ramal=sem_ramal,
        idade_min=idade_min,
        idade_max=idade_max,
        busca=busca,
        ano_cadastro=ano_cadastro,
        skip=skip,
        limit=limit,
    )

    # conta o total com os mesmos filtros (sem paginação)
    from app.models import Cliente as ClienteModel
    from sqlalchemy import or_, func

    query = db.query(ClienteModel)

    if busca:
        query = query.filter(
            or_(
                ClienteModel.nome_cliente.ilike(f"%{busca}%"),
                ClienteModel.sobrenome_cliente.ilike(f"%{busca}%"),
                ClienteModel.email_cliente.ilike(f"%{busca}%"),
            )
        )
    if id_cliente:
        query = query.filter(ClienteModel.id_cliente.ilike(f"%{id_cliente}%"))
    if nome:
        query = query.filter(ClienteModel.nome_cliente.ilike(f"%{nome}%"))
    if sobrenome:
        query = query.filter(ClienteModel.sobrenome_cliente.ilike(f"%{sobrenome}%"))
    if email:
        query = query.filter(ClienteModel.email_cliente.ilike(f"%{email}%"))
    if cidade:
        query = query.filter(ClienteModel.cidade_cliente.in_(cidade))
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
    if sem_ramal:
        query = query.filter(
            (ClienteModel.ramal_cliente == None) |
            (ClienteModel.ramal_cliente == "") |
            (ClienteModel.ramal_cliente == "0")
        )
    elif ramal:
        query = query.filter(ClienteModel.ramal_cliente.ilike(f"{ramal}%"))

    if ano_cadastro:
        query = query.filter(
            func.strftime("%Y", ClienteModel.data_cadastro_cliente).in_(
                [str(a) for a in ano_cadastro]
            )
        )

    total = query.count()

    return {
        "clientes": clientes,
        "total": total,
    }


@router.get("/teste", summary="Diagnóstico interno do banco de clientes", include_in_schema=False)
def teste(db: Session = Depends(get_db)):
    """
    Rota de diagnóstico: imprime a URL do banco conectado e retorna o primeiro
    cliente cadastrado. Usada apenas em troubleshooting; oculta do schema
    público.
    """
    print(db.bind.url)

    from app.models import Cliente as ClienteModel

    cliente = db.query(ClienteModel).first()

    return cliente.__dict__


@router.get("/{cliente_id}", response_model=ClienteResponse, summary="Busca um cliente pelo ID")
def buscar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    """
    Retorna os dados cadastrais de um cliente específico (camada Silver).
    Retorna 404 se o `cliente_id` não existir.
    """
    return get_cliente_by_id(db, cliente_id)


@router.get("/{cliente_id}/historico", response_model=ClienteHistoricoResponse, summary="Histórico de pedidos do cliente")
def buscar_historico_cliente(cliente_id: str, db: Session = Depends(get_db)):
    """
    Retorna o histórico de pedidos do cliente: lista de pedidos com produto,
    valor, status e datas. Usado pela tela de detalhe do cliente.
    """
    return get_cliente_historico(db, cliente_id)

# ROTA 360 - deve ficar ANTES de /{cliente_id} para o roteamento do FastAPI
@router.get(
    "/360/{cliente_id}",
    response_model=Cliente360Response,
    summary="Visão 360 do cliente (camada Gold)",
    dependencies=[Depends(require_cliente_360)],
)
def buscar_cliente_360(
    cliente_id: str,
    db: Session = Depends(get_db_gold),   # usa o banco gold
):
    """
    Retorna a visão 360 do cliente consolidada na camada Gold: LTV, recência,
    NPS médio, ticket médio, total de tickets de suporte, engajamento digital
    e demais métricas agregadas. Alimenta o modal de visão 360 do frontend.
    """
    return get_cliente_360(db, cliente_id)
