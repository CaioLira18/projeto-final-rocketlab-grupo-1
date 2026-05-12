from typing import List, Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    history_json: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sql_used: List[str] = []
    tables_consulted: List[str] = []
    out_of_scope: bool = False
    history_json: str = ""


class SuggestionsResponse(BaseModel):
    suggestions: List[str]