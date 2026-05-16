from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session

from bd.database import get_db
from app.models import Usuario
from app.schemas import TokenResponse, UsuarioCreate, UsuarioResponse, UsuarioLogin
from app.services import (
    SECRET_KEY,
    ALGORITHM,
    authenticate_user,
    create_access_token,
    create_user,
    get_user_by_username,
    get_user_by_email,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# Configura o esquema de segurança do FastAPI para HTTP Bearer (Token tradicional)
security_scheme = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db), token: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Extrai a string de token do objeto HTTPAuthorizationCredentials
        token_str = token.credentials
        payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo"
        )
    return user


@router.post(
    "/register",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra um novo usuário",
)
def registrar_usuario(user_in: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Cria uma nova conta de usuário no sistema.

    Valida que o `username` e o `email` ainda não estão em uso antes de
    persistir o registro. A senha é armazenada com hash (bcrypt), nunca em
    texto puro.

    Retorna o usuário criado (sem a senha). Para obter um token de acesso,
    use o endpoint `POST /auth/login` em seguida.
    """
    user = get_user_by_username(db, user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já cadastrado",
        )
    user_email = get_user_by_email(db, user_in.email)
    if user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já cadastrado",
        )
    return create_user(db, user_in)


@router.post("/login", response_model=TokenResponse, summary="Autentica o usuário e retorna um JWT")
def login_json(user_in: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Autentica o usuário pelo par `email`/`password` e retorna um token JWT
    (`access_token`) que deve ser enviado no header `Authorization: Bearer <token>`
    nas demais requisições protegidas.

    Retorna 401 se as credenciais estiverem incorretas.
    """
    user = authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioResponse, summary="Retorna o perfil do usuário autenticado")
def obter_perfil(current_user: Usuario = Depends(get_current_user)):
    """
    Retorna os dados do usuário autenticado pelo token JWT enviado no header
    `Authorization`. Útil para o frontend descobrir quem é o usuário logado e
    verificar se o token ainda é válido.
    """
    return current_user
