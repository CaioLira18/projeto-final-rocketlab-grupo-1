import os
import requests
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# variaveis do .env (importante colocar os dados do seu databricks!!!)
load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "bd", "app_silver.db")

DATABRICKS_HOST = os.getenv("DATABRICKS_HOST", "").rstrip("/")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN", "")
DEST_DIR = os.getenv("DATABRICKS_DEST_DIR", "/Volumes/stack_overgol/default/landing/")
if DEST_DIR.startswith("dbfs:"):
    DEST_DIR = DEST_DIR.replace("dbfs:", "")
# Garante que termine com barra
if not DEST_DIR.endswith("/"):
    DEST_DIR += "/"

def upload_file_to_databricks(local_file_path, filename):
    """Faz o upload direto via API REST do Databricks (resolve problemas com Volumes da CLI antiga)"""

    url = f"{DATABRICKS_HOST}/api/2.0/fs/files{DEST_DIR}{filename}?overwrite=true"
    headers = {
        "Authorization": f"Bearer {DATABRICKS_TOKEN}",
        "Content-Type": "application/octet-stream"
    }
    
    with open(local_file_path, 'rb') as f:
        data = f.read()
        
    response = requests.put(url, headers=headers, data=data)
    
    if response.status_code in (200, 201, 204):
        print(f"🎉 Upload de {filename} concluído com sucesso!")
    else:
        print(f"❌ Erro HTTP {response.status_code} ao fazer upload de {filename}.")
        print(f"   Mensagem do servidor: {response.text}")
        if response.status_code in (401, 403):
            print("   🚨 DICA: O seu Token expirou, está incorreto ou você não tem permissão de ESCRITA neste Volume.")
            print("            Gere um novo token no Databricks e atualize o seu arquivo .env!")

def export_and_upload():
    print("🚀 Iniciando processo de exportação usando a API REST nativa (Requests)...")
    
    if not DATABRICKS_HOST or not DATABRICKS_TOKEN:
        print("⚠️ Erro: DATABRICKS_HOST ou DATABRICKS_TOKEN não configurados no .env")
        return
        
    engine = create_engine(f"sqlite:///{DB_PATH}")
    
    tables_to_export = {
        "dim_cliente": {
            "filename": "clientes.csv",
            "columns": ["id_cliente", "nome_cliente", "sobrenome_cliente", "email_cliente", "telefone_cliente", "ramal_cliente", "genero_cliente", "data_nascimento_cliente", "data_cadastro_cliente", "endereco_cliente", "cidade_cliente", "estado_cliente", "pais_cliente", "origem_cliente", "ja_tratada"]
        },
        "dim_produto": {
            "filename": "catalogo_produtos.csv",
            "columns": ["id_produto", "nome_produto", "categoria_produto", "preco_produto", "fornecedor_produto", "peso_kg_produto", "estoque_produto", "produto_ativo", "data_cadastro_produto", "ja_tratada"]
        },
        "fato_vendas": {
            "filename": "pedidos.csv",
            "columns": ["id_pedido", "id_cliente", "id_produto", "valor_pedido", "data_pedido", "metodo_pagamento", "status_pedido", "quantidade_produto", "data_prevista_entrega", "ja_tratada"]
        },
        "fato_suporte": {
            "filename": "suporte_tickets.csv",
            "columns": ["ticket_id", "id_cliente", "id_pedido", "tipo_problema", "data_abertura", "data_resolucao", "tempo_resolucao_horas", "agente_suporte", "nota_avaliacao_problema", "sentimento", "status_ticket", "ja_tratada"]
        },
        "fato_avaliacoes": {
            "filename": "avaliacoes.csv",
            "columns": ["id_avaliacao", "id_pedido", "id_cliente", "id_produto", "nota_produto", "comentario_avaliacao", "nota_nps", "recomenda_produto", "data_avaliacao", "ja_tratada"]
        }
    }
    
    for table_name, config in tables_to_export.items():
        csv_filename = config["filename"]
        cols = config["columns"]
        print(f"\n📦 Extraindo dados da tabela '{table_name}'...")
        try:
            df = pd.read_sql_table(table_name, con=engine)
            
            # Reordena as colunas para bater com o CSV original (importante para o Databricks)
            # Se alguma coluna faltar no banco, preenche com None pra não quebrar o schema
            for c in cols:
                if c not in df.columns:
                    df[c] = None
            
            df = df[cols]
            
            df.to_csv(csv_filename, index=False)
            print(f"✅ Arquivo local gerado: {csv_filename} (colunas reordenadas)")
            
            print(f"☁️ Fazendo upload via API para: {DEST_DIR}{csv_filename}...")
            upload_file_to_databricks(csv_filename, csv_filename)
            
            os.remove(csv_filename)
            
        except Exception as e:
            print(f"❌ Erro ao processar a tabela {table_name}: {e}")

    static_files = {
        "silver_clickstream.csv": "clickstream.csv",
        "silver_clientes_dispositivo.csv": "clientes_dispositivo.csv"
    }
    
    silver_data_dir = os.path.join(BASE_DIR, "data", "silver")
    for local_file, csv_filename in static_files.items():
        print(f"\n📂 Preparando arquivo estático '{local_file}'...")
        try:
            local_path = os.path.join(silver_data_dir, local_file)
            if not os.path.exists(local_path):
                print(f"⚠️ Aviso: Arquivo estático {local_path} não encontrado na pasta data/silver.")
                continue
                
            print(f"☁️ Fazendo upload via API para: {DEST_DIR}{csv_filename}...")
            upload_file_to_databricks(local_path, csv_filename)
            
        except Exception as e:
            print(f"❌ Erro ao processar arquivo estático {local_file}: {e}")

if __name__ == "__main__":
    export_and_upload()
