from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from models import FatoSuporte
from schemas import FatoSuporte

# Iniciando o router para suporte
router = APIRouter(prefix="/tickets", tags=["Tickets"])


# Converte o resultado da query em um schema de resposta
def _row_to_schema(r) -> FatoSuporte:
    return FatoSuporte(
        ticket_id=r.ticket_id,
        id_cliente=r.id_cliente,
        nome_cliente=r.nome_cliente,
        id_pedido=r.id_pedido,
        data_pedido=r.data_pedido,
        tipo_problema=r.tipo_problema,
        data_abertura=r.data_abertura,
        data_resolucao=r.data_resolucao,
        tempo_resolucao_horas=r.tempo_resolucao_horas,
        agente_suporte=r.agente_suporte,
    )


# Rota para listar tickets com filtros
@router.get("/", response_model=List[FatoSuporte])
def listar_tickets(
    id_cliente: Optional[str] = Query(None, description="Filtrar por ID do cliente"),
    tipo_problema: Optional[str] = Query(None, description="Filtrar por tipo de problema: Pagamento, Entrega, Produto ou Reembolso"),
    resolvido: Optional[bool] = Query(None, description="Filtrar por status: true = resolvido | false = em aberto"),
    data_abertura_inicio: Optional[str] = Query(None, description="Data de abertura — início (YYYY-MM-DD)"),
    data_abertura_fim: Optional[str] = Query(None, description="Data de abertura — fim (YYYY-MM-DD)"),
    tempo_min_horas: Optional[int] = Query(None, description="Tempo mínimo de resolução em horas"),
    tempo_max_horas: Optional[int] = Query(None, description="Tempo máximo de resolução em horas"),
    skip: int = Query(0, ge=0, description="Registros para pular (paginação)"),
    limit: int = Query(50, ge=1, le=500, description="Limite de registros por página"),
    db: Session = Depends(get_db),
):
    query = db.query(FatoSuporte)

    # Verificação de filtros
    if id_cliente:
        query = query.filter(FatoSuporte.id_cliente == id_cliente)
    if tipo_problema:
        query = query.filter(FatoSuporte.tipo_problema == tipo_problema)
    if resolvido is True:
        query = query.filter(FatoSuporte.data_resolucao.isnot(None))
    if resolvido is False:
        query = query.filter(FatoSuporte.data_resolucao.is_(None))
    if data_abertura_inicio:
        query = query.filter(FatoSuporte.data_abertura >= data_abertura_inicio)
    if data_abertura_fim:
        query = query.filter(FatoSuporte.data_abertura <= data_abertura_fim)
    if tempo_min_horas is not None:
        query = query.filter(FatoSuporte.tempo_resolucao_horas >= tempo_min_horas)
    if tempo_max_horas is not None:
        query = query.filter(FatoSuporte.tempo_resolucao_horas <= tempo_max_horas)

    return [_row_to_schema(r) for r in query.offset(skip).limit(limit).all()]


# Rota para buscar um ticket específico por ID
@router.get("/{ticket_id}", response_model=FatoSuporte)
def buscar_ticket(ticket_id: str, db: Session = Depends(get_db)):
    resultado = db.query(FatoSuporte).filter(FatoSuporte.ticket_id == ticket_id).first()

    # Se o ticket não for encontrado, retorna 404
    if not resultado:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    return _row_to_schema(resultado)