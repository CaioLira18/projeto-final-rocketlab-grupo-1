from fastapi import APIRouter, Depends

from app.routes.auth import get_current_user
from app.schemas.agente import ChatRequest, ChatResponse, SuggestionsResponse
from app.services.agente_service import list_suggested_questions, run_agent

router = APIRouter(
    prefix="/agent",
    tags=["AI Agent"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    history_bytes = None

    if request.history_json and request.history_json not in ("null", ""):
        history_bytes = request.history_json.encode()

    result, updated_history = await run_agent(request.message, history_bytes)

    return ChatResponse(
        answer=result.answer,
        sql_used=result.sql_used,
        tables_consulted=result.tables_consulted,
        out_of_scope=result.out_of_scope,
        history_json=updated_history.decode(),
    )


@router.get(
    "/suggestions",
    response_model=SuggestionsResponse,
    summary="Retorna sugestões de perguntas para o chat",
)
def get_suggestions() -> SuggestionsResponse:
    return SuggestionsResponse(suggestions=list_suggested_questions())