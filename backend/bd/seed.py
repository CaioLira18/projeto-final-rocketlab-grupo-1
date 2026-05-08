import os
import sys
import time
from datetime import datetime
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

# Adiciona o diretório raiz do backend ao sys.path para imports absolutos
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from bd.database import SessionLocal, engine, Base
from app.models import Cliente, DimProduto, FatoAvaliacoes, FatoSuporte, Pedidos

def parse_date_obj(val):
    if pd.isna(val) or val is None or val == "":
        return None
    try:
        date_str = str(val).strip().split()[0]
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None

def clean_nan_fields(record: dict) -> dict:
    cleaned = {}
    for k, v in record.items():
        clean_key = k.replace("\ufeff", "").strip()
        if pd.isna(v) or (isinstance(v, float) and np.isnan(v)):
            cleaned[clean_key] = None
        else:
            cleaned[clean_key] = v
    return cleaned

def calculate_faixa_preco(price):
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

def bulk_insert_in_chunks(db: Session, Model, records: list, batch_size=10000):
    total = len(records)
    print(f"Inserindo {total} registros na tabela '{Model.__tablename__}' em blocos de {batch_size}...")
    
    start_time = time.time()
    for i in range(0, total, batch_size):
        chunk = records[i:i+batch_size]
        db.bulk_insert_mappings(Model, chunk)
        db.commit()
        
    elapsed = time.time() - start_time
    print(f"Inserção na tabela '{Model.__tablename__}' concluída em {elapsed:.2f} segundos!")

def seed_database():
    db = SessionLocal()
    print("Conectado ao banco de dados SQLite...")
    
    Base.metadata.create_all(bind=engine)
    
    csv_mappings = [
        {
            "file": os.path.join(BACKEND_DIR, "data/silver_clientes.csv"),
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
            "file": os.path.join(BACKEND_DIR, "data/silver_catalogo_produtos.csv"),
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
            "file": os.path.join(BACKEND_DIR, "data/silver_pedidos.csv"),
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
            "file": os.path.join(BACKEND_DIR, "data/silver_avaliacoes.csv"),
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
            "file": os.path.join(BACKEND_DIR, "data/silver_suporte_tickets.csv"),
            "model": FatoSuporte,
            "mapper": lambda row: clean_nan_fields({
                "ticket_id": row.get("ticket_id"),
                "id_cliente": row.get("id_cliente"),
                "id_pedido": row.get("id_pedido"),
                "tipo_problema": row.get("tipo_problema"),
                "data_abertura": row.get("data_abertura"),
                "data_resolucao": row.get("data_resolucao"),
                "tempo_resolucao_horas": float(row.get("tempo_resolucao_horas")) if pd.notna(row.get("tempo_resolucao_horas")) else None,
                "agente_suporte": row.get("agente_suporte")
            })
        }
    ]

    try:
        print("\nLimpando dados anteriores das tabelas para evitar duplicidade...")
        db.query(FatoSuporte).delete()
        db.query(FatoAvaliacoes).delete()
        db.query(Pedidos).delete()
        db.query(DimProduto).delete()
        db.query(Cliente).delete()
        db.commit()
        print("Limpeza concluída com sucesso.")

        global_start = time.time()
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

        elapsed_total = time.time() - global_start
        print(f"\n🎉 Sucesso! Banco de dados populado com sucesso em {elapsed_total:.2f} segundos!")

    except Exception as e:
        print(f"\n❌ Erro durante a população do banco de dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
