#!/usr/bin/env python3
"""
Script de teste rápido para validar o chatbot
Executa testes básicos sem need de API Key
"""

import sys
import json

print("=" * 70)
print("🧪 TESTE DE VALIDAÇÃO - CHATBOT CRM")
print("=" * 70 + "\n")

# Teste 1: Importações
print("✓ Teste 1: Importações...")
try:
    from tools import tools_definition, available_tools
    print("  ✅ Ferramentas importadas com sucesso")
    print(f"  📊 Total de ferramentas: {len(available_tools)}")
    print(f"  🔧 Total de definições: {len(tools_definition)}\n")
except Exception as e:
    print(f"  ❌ ERRO: {e}\n")
    sys.exit(1)

# Teste 2: Banco de dados
print("✓ Teste 2: Conexão com banco de dados...")
try:
    import sqlite3
    DB_PATH = r'..\backend\bd\app_gold.db'
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    conn.close()
    
    print(f"  ✅ Banco de dados acessível")
    print(f"  📊 Tabelas encontradas: {len(tables)}")
    for table in tables[:5]:
        print(f"     - {table[0]}")
    if len(tables) > 5:
        print(f"     ... e mais {len(tables) - 5} tabelas\n")
    else:
        print()
except Exception as e:
    print(f"  ❌ ERRO: {e}\n")
    print(f"  📌 Dica: Certifique-se que o banco existe em: {DB_PATH}\n")

# Teste 3: Ferramentas básicas
print("✓ Teste 3: Executando ferramentas básicas...")
try:
    # Test 3.1: Saúde Financeira
    print("  1. get_saude_financeira_geral()...")
    result = available_tools['get_saude_financeira_geral']()
    if 'erro' not in result:
        print(f"     ✅ OK - Receita Total: R$ {result.get('receita_total', 'N/A')}")
    else:
        print(f"     ⚠️  {result['erro']}")
    
    # Test 3.2: NPS
    print("  2. get_nps_media()...")
    result = available_tools['get_nps_media']()
    if 'nps_medio' in result:
        print(f"     ✅ OK - NPS: {result.get('nps_medio', 'N/A')}")
    else:
        print(f"     ⚠️  {result.get('erro', 'Sem dados')}")
    
    # Test 3.3: Segmentação
    print("  3. get_segmentacao_clientes_por_valor()...")
    result = available_tools['get_segmentacao_clientes_por_valor']()
    if isinstance(result, list) and len(result) > 0:
        print(f"     ✅ OK - {len(result)} segmentos encontrados")
    else:
        print(f"     ⚠️  Sem dados ou erro")
    
    print()
except Exception as e:
    print(f"  ❌ ERRO: {e}\n")

# Teste 4: Estrutura de Requisição API
print("✓ Teste 4: Estrutura de requisição API...")
try:
    import requests
    
    # Verificar se .env existe
    from dotenv import load_dotenv
    import os
    load_dotenv()
    
    api_key = os.getenv('API_KEY')
    if api_key and api_key != 'seu_chave_api_openrouter_aqui':
        print("  ✅ API_KEY configurada")
        
        # Teste conexão (sem consumir muitos créditos)
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000"
        }
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": [{"role": "user", "content": "Oi"}],
            "max_tokens": 10
        }
        
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                print("  ✅ Conexão com OpenRouter OK")
            else:
                print(f"  ⚠️  OpenRouter retornou: {response.status_code}")
        except requests.exceptions.Timeout:
            print("  ⚠️  Timeout na conexão (internet lenta?)")
        except Exception as e:
            print(f"  ⚠️  Erro: {str(e)[:50]}")
    else:
        print("  ⚠️  API_KEY não configurada")
        print("     Execute: copy .env.example .env")
        print("     E adicione sua API_KEY\n")
except Exception as e:
    print(f"  ⚠️  Erro: {str(e)[:50]}\n")

# Teste 5: Funções auxiliares
print("✓ Teste 5: Funções auxiliares do chatbot...")
try:
    from chatbot import (
        get_tool_description, 
        format_args, 
        simplify_tool_name,
        TOOL_DESCRIPTIONS
    )
    
    print(f"  ✅ Funções auxiliares importadas")
    print(f"  📊 Total de descrições: {len(TOOL_DESCRIPTIONS)}")
    
    # Teste exemplo
    test_tool = "get_saude_financeira_geral"
    desc = get_tool_description(test_tool)
    print(f"     Exemplo: {test_tool}")
    print(f"             → {desc}\n")
except Exception as e:
    print(f"  ⚠️  Erro: {e}\n")

# Resumo Final
print("=" * 70)
print("✅ TESTES CONCLUÍDOS")
print("=" * 70)
print("""
📋 Próximos Passos:

1. Se todos os testes passaram:
   python chatbot.py

2. Se faltou API_KEY:
   - Acesse https://openrouter.ai
   - Copie sua API Key
   - Execute: echo API_KEY=sua_chave > .env

3. Se faltou banco de dados:
   - Certifique-se que 'app_gold.db' está em: backend\bd\
   - Ou atualize DB_PATH em tools.py

4. Se houve outros erros:
   - Verifique a documentação TESTES_VALIDACAO.md
   - Execute os testes detalhados
""")
print("=" * 70 + "\n")
