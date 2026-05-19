# -----------------------------
# Endpoints de pedidos
# -----------------------------
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
