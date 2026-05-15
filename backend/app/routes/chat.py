import traceback
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Carrega GEMINI_API_KEY do .env do agente antes de importar o chat_service
_ai_env = Path(__file__).resolve().parents[3] / "ai-agent" / ".env"
load_dotenv(_ai_env, override=False)

from app.services.chat_service import agent, SUGGESTED_QUESTIONS
from app.routes.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Agente IA"])

# Histórico em memória por sessão: session_id -> lista de mensagens PydanticAI
_sessions: dict[str, list] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    response: str


class SuggestionsResponse(BaseModel):
    suggestions: list[str]


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, _=Depends(get_current_user)):
    history = _sessions.get(req.session_id, [])
    try:
        result = await agent.run(req.message, message_history=history)
        _sessions[req.session_id] = list(result.all_messages())
        return ChatResponse(response=result.data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions", response_model=SuggestionsResponse)
def get_suggestions(_=Depends(get_current_user)):
    """Lista de perguntas sugeridas exibidas na tela inicial do chat."""
    return SuggestionsResponse(suggestions=SUGGESTED_QUESTIONS)


@router.delete("/session/{session_id}", status_code=204)
def clear_session(session_id: str, _=Depends(get_current_user)):
    _sessions.pop(session_id, None)
