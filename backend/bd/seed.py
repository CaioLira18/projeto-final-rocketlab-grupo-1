"""
RocketLab API - Script de Seeding do Banco de Dados (Silver & Gold)

Este script realiza a população automatizada e de alta performance de ambos
os bancos de dados SQLite do projeto (app_silver.db e app_gold.db) a partir
dos arquivos CSV processados no pipeline de dados.
"""

# ==============================================================================
# 1. SETUP DE IMPORTS & CONFIGURAÇÃO DO AMBIENTE
# ==============================================================================
import os
import sys
import time
from datetime import datetime
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

# Garante que o diretório raiz do backend esteja no sys.path para imports absolutos
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Conexões, engines e bases dos múltiplos bancos de dados (Silver e Gold separados)
from bd.database import SessionLocal, engine_silver, engine_gold, Base, BaseGold
from app.models import (
    Cliente, DimProduto, FatoAvaliacoes, FatoSuporte, Pedidos,
    VendasPeriodo, Cliente360, ClienteGold, ProdutoGold, Produto360
)


# ==============================================================================
# 2. FUNÇÕES AUXILIARES DE TRATAMENTO DE DADOS
# ==============================================================================
def parse_date_obj(val):
    """Converte valores brutos de data em objetos datetime.date estruturados."""
    if pd.isna(val) or val is None or val == "":
        return None
    try:
        date_str = str(val).strip().split()[0]
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None


def parse_datetime_obj(val):
    """Converte data e hora operacionais (com T ou milissegundos) em datetime."""
    if pd.isna(val) or val is None or val == "":
        return None
    try:
        val_str = str(val).strip()
        if "T" in val_str:
            val_str = val_str.replace("T", " ")
        if "." in val_str:
            val_str = val_str.split(".")[0]
        
        if " " in val_str:
            return datetime.strptime(val_str, "%Y-%m-%d %H:%M:%S")
        else:
            return datetime.strptime(val_str, "%Y-%m-%d")
    except Exception:
        return None


def clean_nan_fields(record: dict) -> dict:
    """Substitui valores inválidos/NaN do Pandas por None para integridade do banco."""
    cleaned = {}
    for k, v in record.items():
        clean_key = k.replace("\ufeff", "").strip()
        if pd.isna(v) or (isinstance(v, float) and np.isnan(v)):
            cleaned[clean_key] = None
        else:
            cleaned[clean_key] = v
    return cleaned


def calculate_faixa_preco(price):
    """Classifica dinamicamente as faixas de preço para os produtos."""
    if price is None or pd.isna(price):
        return None
    try:
        p = float(price)
        if p <= 50.0:
            return "baixo"
        elif p <= 150.0:
            return "medio"
        else:
            return "alto"
    except ValueError:
        return None


# ==============================================================================
# 3. MOTOR DE SEEDING POR BLOCOS (BULK INSERT)
# ==============================================================================
def bulk_insert_in_chunks(db: Session, Model, records: list, batch_size=10000):
    """Insere registros no banco em blocos gerenciáveis de forma ultra veloz."""
    total = len(records)
    print(f"Inserindo {total} registros na tabela '{Model.__tablename__}' em blocos de {batch_size}...")
    
    start_time = time.time()
    for i in range(0, total, batch_size):
        chunk = records[i:i+batch_size]
        db.bulk_insert_mappings(Model, chunk)
        db.commit()
        
    elapsed = time.time() - start_time
    print(f"Inserção na tabela '{Model.__tablename__}' concluída em {elapsed:.2f} segundos!")


# ==============================================================================
# 4. SCRIPT PRINCIPAL DE POPULAÇÃO DOS BANCOS (SEED)
# ==============================================================================
def seed_database():
    """Gerencia a criação e carga de dados nos dois bancos de dados independentes."""
    from bd.database import SessionGold
    
    # Inicializa as sessões de conexão com cada banco
    db = SessionLocal()       # Banco Silver
    db_gold = SessionGold()   # Banco Gold
    
    print("Conectado aos bancos de dados SQLite (Silver e Gold)...")
    
    # Cria as tabelas necessárias automaticamente caso não existam
    Base.metadata.create_all(bind=engine_silver)
    BaseGold.metadata.create_all(bind=engine_gold)
    
    # Mapeamento de carregamento de arquivos CSV para a camada Silver
    csv_mappings = [
        {
            "file": os.path.join(BACKEND_DIR, "data/silver/silver_clientes.csv"),
            "model": Cliente,
            "mapper": lambda row: clean_nan_fields({
                "id_cliente": row.get("id_cliente"),
                "nome_cliente": row.get("nome_cliente"),
                "sobrenome_cliente": row.get("sobrenome_cliente"),
                "email_cliente": row.get("email_cliente"),
                "telefone_cliente": row.get("telefone_cliente"),
                "ramal_cliente": str(int(float(row.get("ramal_cliente")))) if pd.notna(row.get("ramal_cliente")) and str(row.get("ramal_cliente")).strip() != "" else None,
                "genero_cliente": row.get("genero_cliente"),
                "endereco_cliente": row.get("endereco_cliente"),
                "cidade_cliente": row.get("cidade_cliente"),
                "estado_cliente": row.get("estado_cliente"),
                "pais_cliente": row.get("pais_cliente"),
                "origem_cliente": row.get("origem_cliente"),
                "data_nascimento_cliente": row.get("data_nascimento_cliente")
            })
        },
        {
            "file": os.path.join(BACKEND_DIR, "data/silver/silver_catalogo_produtos.csv"),
            "model": DimProduto,
            "mapper": lambda row: clean_nan_fields({
                "id_produto": row.get("id_produto"),
                "nome_produto": row.get("nome_produto"),
                "categoria_produto": row.get("categoria_produto"),
                "preco_produto": float(row.get("preco_produto")) if pd.notna(row.get("preco_produto")) else None,
                "fornecedor_produto": row.get("fornecedor_produto"),
                "estoque_produto": int(float(row.get("estoque_produto"))) if pd.notna(row.get("estoque_produto")) else None,
                "produto_ativo": bool(row.get("produto_ativo")) if pd.notna(row.get("produto_ativo")) else None,
                "faixa_preco": calculate_faixa_preco(row.get("preco_produto"))
            })
        },
        {
            "file": os.path.join(BACKEND_DIR, "data/silver/silver_pedidos.csv"),
            "model": Pedidos,
            "mapper": lambda row: clean_nan_fields({
                "id_pedido": row.get("id_pedido"),
                "data_pedido": parse_date_obj(row.get("data_pedido")),
                "id_cliente": row.get("id_cliente"),
                "id_produto": row.get("id_produto"),
                "quantidade_produto": int(float(row.get("quantidade_produto"))) if pd.notna(row.get("quantidade_produto")) else None,
                "valor_pedido": float(row.get("valor_pedido")) if pd.notna(row.get("valor_pedido")) else None,
                "metodo_pagamento": row.get("metodo_pagamento"),
                "status_pedido": row.get("status_pedido")
            })
        },
        {
            "file": os.path.join(BACKEND_DIR, "data/silver/silver_avaliacoes.csv"),
            "model": FatoAvaliacoes,
            "mapper": lambda row: clean_nan_fields({
                "id_avaliacao": row.get("id_avaliacao"),
                "id_cliente": row.get("id_cliente"),
                "id_produto": row.get("id_produto"),
                "id_pedido": row.get("id_pedido"),
                "nota_produto": float(row.get("nota_produto")) if pd.notna(row.get("nota_produto")) else None,
                "nota_nps": float(row.get("nota_nps")) if pd.notna(row.get("nota_nps")) else None,
                "recomenda_produto": bool(row.get("recomenda_produto")) if pd.notna(row.get("recomenda_produto")) else None,
                "data_avaliacao": row.get("data_avaliacao")
            })
        },
        {
            "file": os.path.join(BACKEND_DIR, "data/silver/silver_suporte_tickets.csv"),
            "model": FatoSuporte,
            "mapper": lambda row: clean_nan_fields({
                "ticket_id": row.get("ticket_id"),
                "id_cliente": row.get("id_cliente"),
                "id_pedido": row.get("id_pedido"),
                "tipo_problema": row.get("tipo_problema"),
                "data_abertura": parse_datetime_obj(row.get("data_abertura")),
                "data_resolucao": parse_datetime_obj(row.get("data_resolucao")),
                "tempo_resolucao_horas": float(row.get("tempo_resolucao_horas")) if pd.notna(row.get("tempo_resolucao_horas")) else None,
                "agente_suporte": row.get("agente_suporte")
            })
        }
    ]

    try:
        # 1. ETAPA DE LIMPEZA GERAL DE AMBOS OS BANCOS (EVITAR DUPLICIDADE)
        print("\nLimpando dados anteriores das tabelas para evitar duplicidade...")
        db.query(FatoSuporte).delete()
        db.query(FatoAvaliacoes).delete()
        db.query(Pedidos).delete()
        db.query(DimProduto).delete()
        db.query(Cliente).delete()
        db.commit()

        db_gold.query(VendasPeriodo).delete()
        db_gold.query(Cliente360).delete()
        db_gold.query(ClienteGold).delete()
        db_gold.query(ProdutoGold).delete()
        db_gold.query(Produto360).delete()
        db_gold.commit()
        print("Limpeza concluída com sucesso.")

        global_start = time.time()
        
        # 2. SEEDING DA CAMADA SILVER (ORM BULK INSERT CHUNKS)
        for mapping in csv_mappings:
            filepath = mapping["file"]
            model = mapping["model"]
            mapper = mapping["mapper"]
            
            if not os.path.exists(filepath):
                print(f"Aviso: Arquivo '{filepath}' não encontrado. Pulando...")
                continue
                
            print(f"\nCarregando dados de '{filepath}'...")
            df = pd.read_csv(filepath, encoding="utf-8-sig")
            df.columns = [col.replace("\ufeff", "").strip() for col in df.columns]
            
            print(f"Mapeando {len(df)} linhas para a entidade '{model.__name__}'...")
            records = []
            for _, row in df.iterrows():
                row_dict = row.to_dict()
                mapped_record = mapper(row_dict)
                records.append(mapped_record)
            
            bulk_insert_in_chunks(db, model, records, batch_size=15000)

        # 3. SEEDING DA CAMADA GOLD (PANDAS DIRECT TO_SQL ROUTING)
        print("\n--- INICIANDO POPULAÇÃO DA CAMADA GOLD ---")
        gold_mappings = [
            {
                "file": os.path.join(BACKEND_DIR, "data/gold/dm_vendas_periodo.csv"),
                "table": "dm_vendas_periodo",
                "parse_dates": ["data_pedido"]
            },
            {
                "file": os.path.join(BACKEND_DIR, "data/gold/dm_cliente_360.csv"),
                "table": "dm_cliente_360",
                "parse_dates": []
            },
            {
                "file": os.path.join(BACKEND_DIR, "data/gold/dim_cliente.csv"),
                "table": "dim_cliente",
                "parse_dates": []
            },
            {
                "file": os.path.join(BACKEND_DIR, "data/gold/dim_produto.csv"),
                "table": "dim_produto",
                "parse_dates": []
            },
            {
                "file": os.path.join(BACKEND_DIR, "data/gold/dm_produto_360.csv"),
                "table": "dm_produto_360",
                "parse_dates": []
            }
        ]

        for g_map in gold_mappings:
            filepath = g_map["file"]
            tablename = g_map["table"]
            parse_dates = g_map["parse_dates"]

            if not os.path.exists(filepath):
                print(f"Aviso: Arquivo Gold '{filepath}' não encontrado. Pulando...")
                continue

            print(f"Carregando dados Gold de '{filepath}'...")
            start_gold = time.time()
            df_gold = pd.read_csv(filepath, encoding="utf-8-sig")
            df_gold.columns = [col.replace("\ufeff", "").strip() for col in df_gold.columns]
            
            # Converte os tipos de dados temporais para date se necessário
            for date_col in parse_dates:
                if date_col in df_gold.columns:
                    df_gold[date_col] = pd.to_datetime(df_gold[date_col]).dt.date

            # Insere no banco Gold (app_gold.db) de forma nativa e extremamente rápida
            print(f"Inserindo {len(df_gold)} registros na tabela Gold '{tablename}' via to_sql...")
            df_gold.to_sql(tablename, engine_gold, if_exists="append", index=False, chunksize=20000)
            print(f"Tabela Gold '{tablename}' populada com sucesso em {time.time() - start_gold:.2f} segundos!")

        # 4. CRIAÇÃO DO USUÁRIO ADMINISTRADOR PADRÃO (SISTEMA OPERACIONAL)
        print("\nCriando usuário administrador padrão para testes...")
        from app.models.usuario import Usuario
        from app.services.auth_service import get_password_hash

        db.query(Usuario).delete()
        db.commit()

        default_admin = Usuario(
            username="admin",
            email="admin@stackovergol.com",
            hashed_password=get_password_hash("admin123"),
            is_active=True
        )
        db.add(default_admin)
        db.commit()
        print("👤 Usuário administrador criado com sucesso!")
        print("   👉 Username: admin")
        print("   👉 Email: admin@stackovergol.com")
        print("   👉 Senha: admin123")

        elapsed_total = time.time() - global_start
        print(f"\n🎉 Sucesso! Ambos os bancos de dados populados em {elapsed_total:.2f} segundos!")

    except Exception as e:
        print(f"\n❌ Erro durante a população do banco de dados: {e}")
        db.rollback()
    finally:
        # Libera e encerra as sessões com segurança
        db.close()
        db_gold.close()


if __name__ == "__main__":
    seed_database()
