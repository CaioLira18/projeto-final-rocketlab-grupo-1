import os
import requests
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# variaveis do .env (importante colocar os dados do seu databricks!!!)
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "app_silver.db")

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
        "dim_cliente": "clientes.csv",
        "dim_produto": "catalogo_produtos.csv",
        "fato_vendas": "pedidos.csv",
        "fato_suporte": "suporte_tickets.csv",
        "fato_avaliacoes": "avaliacoes.csv"
    }
    
    for table_name, csv_filename in tables_to_export.items():
        print(f"\n📦 Extraindo dados da tabela '{table_name}'...")
        try:
            df = pd.read_sql_table(table_name, con=engine)
            df.to_csv(csv_filename, index=False)
            print(f"✅ Arquivo local gerado: {csv_filename}")
            
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
