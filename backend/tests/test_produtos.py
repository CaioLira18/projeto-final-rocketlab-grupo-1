import pytest
from app.schemas.produto import ProdutoCreate, ProdutoUpdate


# -----------------------------
# Endpoints de produtos
# -----------------------------
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


# -----------------------------
# Validação dos schemas de produto
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
