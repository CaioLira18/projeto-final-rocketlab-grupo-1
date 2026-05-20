import traceback
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pydantic_ai.exceptions import ModelHTTPError

from app.services.chat_service import agent, SUGGESTED_QUESTIONS
from app.routes.dependencies import require_chat

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
async def chat(req: ChatRequest, _=Depends(require_chat)):
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
        return ChatResponse(response=result.output)
    except ModelHTTPError as e:
        traceback.print_exc()
        # body pode ser dict, str ou None: serializamos para sempre conseguir buscar padrões
        body_str = str(e.body) if e.body is not None else ""
        is_quota = e.status_code == 429 or "RESOURCE_EXHAUSTED" in body_str
        if is_quota:
            # Cota diária (RPD): só renova após reset diário do Google, ~24h
            is_daily = "PerDay" in body_str or "free_tier_requests" in body_str
            if is_daily:
                detail = (
                    "O limite diário gratuito da API de IA foi atingido. "
                    "O agente voltará a responder após a renovação da cota (geralmente em até 24h). (429)"
                )
            else:
                # Limite por minuto (RPM): aguardar alguns segundos resolve
                detail = (
                    "Muitas perguntas em pouco tempo: o limite por minuto da API de IA foi atingido. "
                    "Aguarde alguns instantes e tente novamente. (429)"
                )
            raise HTTPException(status_code=429, detail=detail)
        # 503 UNAVAILABLE: sobrecarga momentânea do modelo no lado do Google.
        # Não consome cota e geralmente resolve em segundos; mensagem específica ajuda o usuário a saber que basta tentar de novo.
        if e.status_code == 503 or "UNAVAILABLE" in body_str:
            raise HTTPException(
                status_code=503,
                detail="A API de IA está com alta demanda no momento. Tente novamente em alguns instantes. (503)",
            )
        raise HTTPException(
            status_code=500,
            detail="Ocorreu um erro ao se comunicar com a API de IA. Tente novamente mais tarde.",
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao processar sua pergunta. Tente novamente.")


@router.get("/suggestions", response_model=SuggestionsResponse, summary="Lista perguntas sugeridas")
def get_suggestions(_=Depends(require_chat)):
    """
    Retorna a lista fixa de perguntas sugeridas exibidas na tela inicial do
    chat, usadas como atalhos clicáveis para o usuário começar a conversa.
    """
    return SuggestionsResponse(suggestions=SUGGESTED_QUESTIONS)


@router.delete("/session/{session_id}", status_code=204, summary="Apaga o histórico de uma sessão")
def clear_session(session_id: str, _=Depends(require_chat)):
    """
    Remove o histórico em memória de uma sessão do chat. As próximas
    mensagens com este `session_id` voltam a começar do zero, sem contexto.
    """
    _sessions.pop(session_id, None)
