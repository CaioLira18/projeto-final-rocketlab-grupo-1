from fastapi import APIRouter, Depends
from typing import List

from app.schemas.agente import ChatRequest, ChatResponse, SuggestionsResponse
from app.services.agente_service import run_agent, list_suggested_questions
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/agent",
    tags=["AI Agent"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Conversa com o agente CRM em linguagem natural",
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Recebe uma pergunta em linguagem natural e o histórico da conversa.
    O agente consulta o banco Gold via Text-to-SQL e retorna a resposta.
    """
    history = [msg.model_dump() for msg in request.history]
    result = await run_agent(request.message, history)

    return ChatResponse(
        answer=result.answer,
        sql_used=result.sql_used,
        tables_consulted=result.tables_consulted,
        out_of_scope=result.out_of_scope,
    )


@router.get(
    "/suggestions",
    response_model=SuggestionsResponse,
    summary="Retorna sugestões de perguntas para o chat",
)
def get_suggestions() -> SuggestionsResponse:
    """
    Retorna uma lista de perguntas sugeridas para orientar o usuário
    ao iniciar o chat com o agente.
    """
    return SuggestionsResponse(suggestions=list_suggested_questions())