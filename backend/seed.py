import os
import sqlite3
import pandas as pd

def popular_banco_via_csv():
    """
    Popula o banco de dados lendo arquivos CSV via Pandas.
    É extremamente rápido e ideal para tabelas fato/dimensão grandes.
    """
    print("Iniciando processo de Seed...")
    
    tabelas_csvs = {
        "dim_cliente": "seed_data/silver_clientes.csv",
        "dim_produto": "seed_data/silver_catalogo_produtos.csv",
        "fato_avaliacoes": "seed_data/silver_avaliacoes.csv",
        "fato_suporte": "seed_data/silver_suporte_tickets.csv",
        "fato_vendas": "seed_data/silver_pedidos.csv",
        "fato_clickstream": "seed_data/silver_clickstream.csv",
        "dim_cliente_dispositivo": "seed_data/silver_clientes_dispositivo.csv"
    }

    conn = sqlite3.connect("app.db")
    
    for tabela, caminho_csv in tabelas_csvs.items():
        if not os.path.exists(caminho_csv):
            print(f"⚠️ Aviso: Arquivo '{caminho_csv}' não encontrado. Pulando a tabela '{tabela}'.")
            continue
            
        try:
            print(f"⏳ Lendo '{caminho_csv}' e inserindo na tabela '{tabela}'...")
            df = pd.read_csv(caminho_csv)
            df.to_sql(name=tabela, con=conn, if_exists='append', index=False)
            print(f"✅ Sucesso: {len(df)} registros inseridos na tabela '{tabela}'!\n")
            
        except Exception as e:
            print(f"❌ Erro ao popular a tabela '{tabela}': {e}\n")

    conn.close()

if __name__ == "__main__":
    popular_banco_via_csv()
