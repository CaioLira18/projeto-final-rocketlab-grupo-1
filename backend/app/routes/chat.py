import traceback
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

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


@router.post("", response_model=ChatResponse, summary="Envia uma mensagem ao agente de IA")
async def chat(req: ChatRequest, _=Depends(get_current_user)):
    """
    Envia uma pergunta em linguagem natural ao agente de IA e retorna a resposta.

    O agente (Gemini + text-to-SQL) consulta o banco Gold da empresa, monta o
    SQL na hora a partir da pergunta e devolve a resposta em português.

    O histórico da conversa é mantido em memória por `session_id`: enviar
    mensagens com o mesmo `session_id` preserva o contexto da conversa anterior.
    """
    history = _sessions.get(req.session_id, [])
    try:
        result = await agent.run(req.message, message_history=history)
        _sessions[req.session_id] = list(result.all_messages())
        return ChatResponse(response=result.data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions", response_model=SuggestionsResponse, summary="Lista perguntas sugeridas")
def get_suggestions(_=Depends(get_current_user)):
    """
    Retorna a lista fixa de perguntas sugeridas exibidas na tela inicial do
    chat, usadas como atalhos clicáveis para o usuário começar a conversa.
    """
    return SuggestionsResponse(suggestions=SUGGESTED_QUESTIONS)


@router.delete("/session/{session_id}", status_code=204, summary="Apaga o histórico de uma sessão")
def clear_session(session_id: str, _=Depends(get_current_user)):
    """
    Remove o histórico em memória de uma sessão do chat. As próximas
    mensagens com este `session_id` voltam a começar do zero, sem contexto.
    """
    _sessions.pop(session_id, None)
