from pydantic import BaseModel, EmailStr
from typing import Optional


class UsuarioBase(BaseModel):
    username: str
    email: str
    role: str = "operador_suporte"


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioLogin(BaseModel):
    email: str
    password: str


class UsuarioResponse(UsuarioBase):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

