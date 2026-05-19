# -----------------------------
# Endpoints de suporte
# -----------------------------
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
