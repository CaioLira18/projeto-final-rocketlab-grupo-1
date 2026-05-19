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
from app.services.auth_service import get_password_hash


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
