# -----------------------------
# Endpoints de clientes
# -----------------------------
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
