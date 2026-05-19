from app.schemas.usuario import UsuarioLogin


# -----------------------------
# Endpoints gerais
# -----------------------------
def test_root_retorna_boas_vindas(client):
    assert client.get("/").json() == {"message": "Welcome to the RocketLab API!"}


def test_health_check_retorna_ok(client):
    assert client.get("/health").json() == {"status": "ok"}


# -----------------------------
# Autenticação
# -----------------------------
def test_auth_me_com_override(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer fake"})
    assert r.status_code == 200
    assert r.json()["username"] == "admin_teste"


def test_schema_usuario_login_basico():
    login = UsuarioLogin(email="teste@email.com", password="Senha123")
    assert login.email == "teste@email.com"


# -----------------------------
# Chat
# -----------------------------
def test_chat_suggestions(client):
    r = client.get("/chat/suggestions")
    assert r.status_code == 200
    assert "suggestions" in r.json()


def test_limpar_sessao_chat(client):
    assert client.delete("/chat/session/sessao-teste").status_code == 204


# -----------------------------
# Exportação
# -----------------------------
def test_export_clientes_csv(client):
    r = client.get("/export/clientes")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
