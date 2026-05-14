import os
import requests
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# variaveis do .env (importante colocar os dados do seu databricks!!!)
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_GOLD_PATH = os.path.join(BASE_DIR, "bd", "app_gold.db")

DATABRICKS_HOST = os.getenv("DATABRICKS_HOST", "").rstrip("/")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN", "")

# Caminho de onde baixaremos os dados da Gold no Unity Catalog Volumes
GOLD_DIR = os.getenv("DATABRICKS_GOLD_DIR", "/Volumes/stack_overgol/default/gold/").strip()
if GOLD_DIR.startswith("dbfs:"):
    GOLD_DIR = GOLD_DIR.replace("dbfs:", "")
if not GOLD_DIR.endswith("/"):
    GOLD_DIR += "/"

def download_file_from_databricks(filename, local_save_path):
    """Faz o download de um arquivo do Unity Catalog Volumes usando a API REST."""
    url = f"{DATABRICKS_HOST}/api/2.0/fs/files{GOLD_DIR}{filename}"
    headers = {
        "Authorization": f"Bearer {DATABRICKS_TOKEN}"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        # Salva o arquivo CSV no disco
        with open(local_save_path, 'wb') as f:
            f.write(response.content)
        print(f"🎉 Download de {filename} concluído!")
        return True
    else:
        print(f"❌ Erro HTTP {response.status_code} ao baixar {filename}.")
        print(f"   Mensagem do servidor: {response.text}")
        return False

def download_and_import_gold():
    print("🚀 Iniciando processo de sincronização inversa (Databricks -> App Gold)...")
    
    if not DATABRICKS_HOST or not DATABRICKS_TOKEN:
        print("⚠️ Erro: DATABRICKS_HOST ou DATABRICKS_TOKEN não configurados no .env")
        return
        
    engine = create_engine(f"sqlite:///{DB_GOLD_PATH}")
    
    # Mapeamento: "Nome do Arquivo CSV no Databricks" -> "Nome da Tabela no Banco app_gold.db"
    gold_files_to_tables = {
        "dim_cliente.csv": "dim_cliente",
        "dim_produto.csv": "dim_produto",
        "dm_cliente_360.csv": "dm_cliente_360",
        "dm_produto_360.csv": "dm_produto_360",
        "dm_vendas_periodo.csv": "dm_vendas_periodo"
    }
    
    # Pasta local onde os CSVs serão salvos
    gold_data_dir = os.path.join(BASE_DIR, "data", "gold")
    os.makedirs(gold_data_dir, exist_ok=True)
    
    for filename, table_name in gold_files_to_tables.items():
        print(f"\n📥 Baixando arquivo '{filename}' do Databricks...")
        local_csv_path = os.path.join(gold_data_dir, filename)
        
        sucesso = download_file_from_databricks(filename, local_csv_path)
        
        if sucesso:
            print(f"🔄 Sobrescrevendo a tabela '{table_name}' no banco local Gold...")
            try:
                # aq o pandas lê o CSV recém baixado...
                df = pd.read_csv(local_csv_path)
                
                # e salva no banco SQLite. 
                # if_exists="replace" DROPA a tabela antiga e recria ela limpinha e atualizada!
                df.to_sql(table_name, con=engine, if_exists="replace", index=False)
                
                print(f"✅ Tabela '{table_name}' atualizada com sucesso no app_gold.db!")
            except Exception as e:
                print(f"❌ Erro crítico ao inserir dados na tabela {table_name}: {e}")

if __name__ == "__main__":
    download_and_import_gold()
