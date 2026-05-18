"""
Arquivo de testes automatizados do backend RocketLab.

Como usar no VS Code:
1) Coloque este arquivo em: backend/tests/test_backend_automatizado.py
2) No terminal, entre na pasta backend:
      cd backend
3) Instale as dependências de teste:
      pip install -r requirements.txt pytest httpx
4) Rode tudo:
      python -m pytest -v tests/test_backend_automatizado.py

No VS Code, também dá para clicar no botão de play/Run Test que aparece em cima
da função de teste ou da classe/arquivo quando a extensão Python/Pytest está ativa.
"""

from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from bd.database import Base, BaseGold, get_db, get_db_gold
from app.routes.auth import get_current_user
from app.models import Cliente, DimProduto, Pedidos, Usuario, FatoSuporte, FatoAvaliacoes
from app.schemas.produto import ProdutoCreate, ProdutoUpdate
from app.schemas.usuario import UsuarioCreate, UsuarioLogin
from app.services.auth_service import get_password_hash


# -----------------------------
# Banco em memória para os testes
# -----------------------------
@pytest.fixture()
def client():
    engine_silver = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    engine_gold = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSilver = sessionmaker(autocommit=False, autoflush=False, bind=engine_silver)
    TestingGold = sessionmaker(autocommit=False, autoflush=False, bind=engine_gold)

    Base.metadata.create_all(bind=engine_silver)
    BaseGold.metadata.create_all(bind=engine_gold)

    def override_get_db():
        db = TestingSilver()
        try:
            yield db
        finally:
            db.close()

    def override_get_db_gold():
        db = TestingGold()
        try:
            yield db
        finally:
            db.close()

    def override_current_user():
        return SimpleNamespace(
            id=1,
            username="admin_teste",
            email="admin@teste.com",
            role="admin",
            is_active=True,
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_gold] = override_get_db_gold
    app.dependency_overrides[get_current_user] = override_current_user

    seed = TestingSilver()
    seed.add_all([
        Usuario(username="admin_teste", email="admin@teste.com", hashed_password=get_password_hash("Teste@123"), role="admin", is_active=True),
        Cliente(id_cliente="CLI-001", nome_cliente="Joao", sobrenome_cliente="Silva", email_cliente="joao@email.com", cidade_cliente="Recife", estado_cliente="PE", pais_cliente="Brasil", genero_cliente="M", origem_cliente="site", data_nascimento_cliente="2000-01-01"),
        Cliente(id_cliente="CLI-002", nome_cliente="Maria", sobrenome_cliente="Souza", email_cliente="maria@email.com", cidade_cliente="Olinda", estado_cliente="PE", pais_cliente="Brasil", genero_cliente="F", origem_cliente="loja", data_nascimento_cliente="1998-05-10"),
        DimProduto(id_produto="PROD-0001", nome_produto="Notebook Gamer", categoria_produto="Eletrônicos", preco_produto=3500.00, fornecedor_produto="Rocket", estoque_produto=10, produto_ativo=True, peso_kg_produto=2.5),
        DimProduto(id_produto="PROD-0002", nome_produto="Camisa Azul", categoria_produto="Vestuário", preco_produto=80.00, fornecedor_produto="ModaLab", estoque_produto=25, produto_ativo=True, peso_kg_produto=0.3),
        Pedidos(id_pedido="PED-001", id_cliente="CLI-001", id_produto="PROD-0001", quantidade_produto=1, valor_pedido=3500.00, metodo_pagamento="Cartão", status_pedido="Aprovado"),
        Pedidos(id_pedido="PED-002", id_cliente="CLI-002", id_produto="PROD-0002", quantidade_produto=2, valor_pedido=160.00, metodo_pagamento="Pix", status_pedido="Processando"),
        FatoSuporte(ticket_id="TCK-001", id_cliente="CLI-001", id_pedido="PED-001", tipo_problema="Entrega", tempo_resolucao_horas=24, agente_suporte="Ana", nota_avaliacao_problema=5, status_ticket="Resolvido"),
        FatoAvaliacoes(id_avaliacao="AVL-001", id_cliente="CLI-001", id_produto="PROD-0001", id_pedido="PED-001", nota_produto=5, comentario_avaliacao="Bom", nota_nps=9, recomenda_produto=True),
    ])
    seed.commit()
    seed.close()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# -----------------------------
# Testes principais dos endpoints
# -----------------------------
def test_root_retorna_boas_vindas(client):
    assert client.get("/").json() == {"message": "Welcome to the RocketLab API!"}


def test_health_check_retorna_ok(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_listar_produtos_retorna_lista(client):
    r = client.get("/produtos/")
    assert r.status_code == 200
    assert len(r.json()) >= 2


def test_buscar_produto_existente(client):
    r = client.get("/produtos/PROD-0001")
    assert r.status_code == 200
    assert r.json()["nome_produto"] == "Notebook Gamer"


def test_buscar_produto_inexistente_retorna_404(client):
    assert client.get("/produtos/PROD-9999").status_code == 404


def test_filtrar_produto_por_busca(client):
    dados = client.get("/produtos/", params={"busca": "Notebook"}).json()
    assert any(p["id_produto"] == "PROD-0001" for p in dados)


def test_filtrar_produto_por_categoria(client):
    dados = client.get("/produtos/", params={"categoria": "Vestuário"}).json()
    assert all(p["categoria_produto"] == "Vestuário" for p in dados)


def test_filtrar_produto_por_status_ativo(client):
    dados = client.get("/produtos/", params={"produto_ativo": True}).json()
    assert all(p["produto_ativo"] is True for p in dados)


def test_paginacao_produtos_limit_1(client):
    dados = client.get("/produtos/", params={"limit": 1}).json()
    assert len(dados) == 1


def test_criar_produto(client):
    payload = {"id_produto": "PROD-0100", "nome_produto": "Mouse", "categoria_produto": "eletronicos", "preco_produto": 120, "estoque_produto": 5}
    r = client.post("/produtos/", json=payload)
    assert r.status_code == 201
    assert r.json()["categoria_produto"] == "Eletrônicos"


def test_criar_produto_com_id_repetido_retorna_400(client):
    # produto_service.py lança HTTPException(status_code=400) para ID duplicado
    payload = {"id_produto": "PROD-0001", "nome_produto": "Repetido", "categoria_produto": "Casa", "preco_produto": 10}
    assert client.post("/produtos/", json=payload).status_code == 400


def test_criar_produto_com_preco_negativo_retorna_422(client):
    payload = {"id_produto": "PROD-0101", "nome_produto": "Ruim", "categoria_produto": "Casa", "preco_produto": -1}
    assert client.post("/produtos/", json=payload).status_code == 422


def test_atualizar_produto(client):
    r = client.put("/produtos/PROD-0001", json={"preco_produto": 3999.90})
    assert r.status_code == 200
    assert r.json()["preco_produto"] == 3999.90


def test_atualizar_produto_inexistente(client):
    assert client.put("/produtos/PROD-9999", json={"nome_produto": "Nada"}).status_code == 404


def test_deletar_produto(client):
    # Regra de negócio: só é possível deletar produto inativo
    payload = {"id_produto": "PROD-0102", "nome_produto": "Temp", "categoria_produto": "Casa", "preco_produto": 50, "produto_ativo": False}
    client.post("/produtos/", json=payload)
    r = client.delete("/produtos/PROD-0102")
    assert r.status_code == 200
    assert r.json()["id_produto"] == "PROD-0102"


def test_deletar_produto_inexistente(client):
    assert client.delete("/produtos/PROD-9999").status_code == 404


def test_listar_clientes(client):
    r = client.get("/clientes/")
    assert r.status_code == 200
    assert r.json()["total"] >= 2


def test_filtrar_cliente_por_nome(client):
    dados = client.get("/clientes/", params={"nome": "Joao"}).json()
    assert dados["total"] >= 1


def test_filtrar_cliente_por_email(client):
    dados = client.get("/clientes/", params={"email": "maria@email.com"}).json()
    assert dados["total"] >= 1


def test_buscar_cliente_existente(client):
    r = client.get("/clientes/CLI-001")
    assert r.status_code == 200
    assert r.json()["id_cliente"] == "CLI-001"


def test_buscar_cliente_inexistente(client):
    assert client.get("/clientes/CLI-999").status_code == 404


def test_listar_pedidos(client):
    r = client.get("/pedidos/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_filtrar_pedido_por_status(client):
    dados = client.get("/pedidos/", params={"status": "Aprovado"}).json()
    assert all(p["status_pedido"] == "Aprovado" for p in dados)


def test_contar_pedidos(client):
    r = client.get("/pedidos/count")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_suporte_resumo(client):
    r = client.get("/suporte/resumo")
    assert r.status_code == 200
    assert "total" in r.json()


def test_suporte_tickets(client):
    r = client.get("/suporte/tickets")
    assert r.status_code == 200
    assert "x-total-count" in r.headers


def test_suporte_ticket_por_id(client):
    r = client.get("/suporte/tickets/TCK-001")
    assert r.status_code == 200


def test_suporte_ticket_inexistente(client):
    assert client.get("/suporte/tickets/TCK-999").status_code == 404


def test_chat_suggestions(client):
    r = client.get("/chat/suggestions")
    assert r.status_code == 200
    assert "suggestions" in r.json()


def test_limpar_sessao_chat(client):
    assert client.delete("/chat/session/sessao-teste").status_code == 204


def test_auth_me_com_override(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer fake"})
    assert r.status_code == 200
    assert r.json()["username"] == "admin_teste"


def test_export_clientes_csv(client):
    r = client.get("/export/clientes")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")


# -----------------------------
# Testes de validação dos schemas
# -----------------------------
@pytest.mark.parametrize("categoria,esperado", [
    ("eletronicos", "Eletrônicos"), ("electronics", "Eletrônicos"), ("vestuario", "Vestuário"),
    ("moda", "Vestuário"), ("casa", "Casa"), ("lar", "Casa"),
    ("sports", "Esportes"), ("beleza", "Beleza"), ("auto", "Automotivo"),
    ("toys", "Brinquedos"), ("moveis", "Móveis"), ("categoria estranha", "Outros"),
])
def test_normalizacao_categoria_produto(categoria, esperado):
    p = ProdutoCreate(nome_produto="Produto", categoria_produto=categoria, preco_produto=10)
    assert p.categoria_produto == esperado


@pytest.mark.parametrize("preco,esperado", [
    ("R$ 10,50", 10.50), ("99.90", 99.90), (25, 25.0), (10.5, 10.5), (None, None),
])
def test_normalizacao_preco_produto(preco, esperado):
    p = ProdutoCreate(nome_produto="Produto", categoria_produto="Casa", preco_produto=preco)
    assert p.preco_produto == esperado


@pytest.mark.parametrize("estoque,esperado", [(None, 0), ("10", 10), ("10.9", 10), (3, 3), (2.0, 2)])
def test_normalizacao_estoque_produto(estoque, esperado):
    p = ProdutoCreate(nome_produto="Produto", categoria_produto="Casa", preco_produto=10, estoque_produto=estoque)
    assert p.estoque_produto == esperado


@pytest.mark.parametrize("ativo,esperado", [("sim", True), ("S", True), ("true", True), ("não", False), ("0", False)])
def test_normalizacao_produto_ativo(ativo, esperado):
    p = ProdutoCreate(nome_produto="Produto", categoria_produto="Casa", preco_produto=10, produto_ativo=ativo)
    assert p.produto_ativo is esperado


def test_schema_produto_rejeita_sku_invalido():
    with pytest.raises(Exception):
        ProdutoCreate(id_produto="ABC", nome_produto="Produto", categoria_produto="Casa", preco_produto=10)


def test_schema_produto_update_aceita_atualizacao_parcial():
    p = ProdutoUpdate(preco_produto="R$ 120,00")
    assert p.preco_produto == 120.0


def test_schema_usuario_login_basico():
    login = UsuarioLogin(email="teste@email.com", password="Senha123")
    assert login.email == "teste@email.com"