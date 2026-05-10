# 🧪 Guia de Testes e Validação

Este arquivo contém instruções para validar se o chatbot está funcionando corretamente.

## ✅ Pré-requisitos para Teste

Antes de executar testes, certifique-se de:

```bash
# 1. Ambiente virtual ativado
# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

# 2. Dependências instaladas
pip install -r requirements.txt

# 3. Arquivo .env configurado com API_KEY válida
# Verifique que a chave funciona
```

## 🧬 Teste 1: Validação de Importações

Execute este código para verificar se todas as dependências estão corretas:

```bash
python -c "
import requests
import json
from dotenv import load_dotenv
from tools import available_tools, tools_definition
print('✅ Todas as importações OK!')
print(f'📊 Total de ferramentas disponíveis: {len(available_tools)}')
print(f'🔧 Total de definições: {len(tools_definition)}')
"
```

## 🧬 Teste 2: Validação do Banco de Dados

Verifique se o banco de dados está acessível:

```bash
python -c "
import sqlite3

# Teste de conexão
try:
    conn = sqlite3.connect('stack_overgol')
    cursor = conn.cursor()
    
    # Listar tabelas
    cursor.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")
    tables = cursor.fetchall()
    
    print('✅ Banco de dados acessível!')
    print(f'📊 Tabelas encontradas: {len(tables)}')
    for table in tables:
        print(f'   - {table[0]}')
    
    conn.close()
except Exception as e:
    print(f'❌ Erro ao conectar: {e}')
"
```

## 🧬 Teste 3: Validação de Ferramentas Individuais

Teste cada ferramenta individualmente:

```bash
python -c "
from tools import available_tools

# Teste 1: Saúde Financeira Geral
print('1️⃣ Teste: get_saude_financeira_geral')
result = available_tools['get_saude_financeira_geral']()
print(f'   Status: {'✅ OK' if 'erro' not in result else '❌ ERRO'}')
if 'erro' not in result:
    print(f'   Receita Total: R$ {result.get(\"receita_total\", \"N/A\")}')
print()

# Teste 2: Segmentação de Clientes
print('2️⃣ Teste: get_segmentacao_clientes_por_valor')
result = available_tools['get_segmentacao_clientes_por_valor']()
print(f'   Status: {'✅ OK' if not isinstance(result, dict) or 'erro' not in result else '❌ ERRO'}')
if isinstance(result, list) and len(result) > 0:
    print(f'   Segmentos encontrados: {len(result)}')
print()

# Teste 3: Receita por Categoria
print('3️⃣ Teste: get_receita_por_categoria')
result = available_tools['get_receita_por_categoria']()
print(f'   Status: {'✅ OK' if isinstance(result, list) else '❌ ERRO'}')
if isinstance(result, list) and len(result) > 0:
    print(f'   Categorias: {len(result)}')
print()

# Teste 4: NPS Média
print('4️⃣ Teste: get_nps_media')
result = available_tools['get_nps_media']()
print(f'   Status: {'✅ OK' if 'erro' not in result else '❌ ERRO'}')
if 'nps_medio' in result:
    print(f'   NPS Médio: {result[\"nps_medio\"]}')
"
```

## 🧬 Teste 4: Validação da API OpenRouter

Teste se sua chave API está válida:

```bash
python -c "
import requests
import os
from dotenv import load_dotenv

load_dotenv()

url = 'https://openrouter.ai/api/v1/chat/completions'
headers = {
    'Authorization': f'Bearer {os.getenv(\"API_KEY\")}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000'
}

payload = {
    'model': 'openai/gpt-4o-mini',
    'messages': [{'role': 'user', 'content': 'Oi'}],
}

try:
    response = requests.post(url, headers=headers, json=payload, timeout=10)
    data = response.json()
    
    if 'error' in data:
        print(f'❌ ERRO API: {data[\"error\"][\"message\"]}')
    elif 'choices' in data:
        print('✅ Conexão com API OK!')
        print(f'Resposta: {data[\"choices\"][0][\"message\"][\"content\"][:100]}...')
    else:
        print('⚠️  Resposta inesperada')
except Exception as e:
    print(f'❌ Erro de conexão: {e}')
"
```

## 🧬 Teste 5: Teste Manual do Chatbot

Para testar manualmente, abra o chatbot e faça testes com respostas diretas (sem tools):

```bash
python chatbot.py
```

**Faça as seguintes perguntas de teste:**

### Teste 5.1: Resposta Sem Ferramentas
```
"O que é um Analista de Dados de CRM?"
```

**Resultado esperado:** Resposta direta sem usar ferramentas

---

### Teste 5.2: Ferramenta Simples
```
"Qual é a saúde financeira geral da empresa?"
```

**Resultado esperado:**
- ✅ Sistema deve chamar `get_saude_financeira_geral`
- ✅ Retornar dados de receita, ticket médio, LTV
- ✅ Gerar análise com recomendações

---

### Teste 5.3: Ferramenta com Parâmetros
```
"Quais são meus 5 clientes com maior LTV?"
```

**Resultado esperado:**
- ✅ Sistema deve chamar `get_clientes_com_maior_ltv` com `limite=5`
- ✅ Retornar top 5 clientes com suas métricas

---

### Teste 5.4: Múltiplas Ferramentas
```
"Compare meus clientes VIP com os dormentes em termos de satisfação e comportamento"
```

**Resultado esperado:**
- ✅ Sistema deve chamar pelo menos 2 ferramentas
- ✅ Comparar dados de ambos segmentos
- ✅ Gerar insights sobre diferenças

---

### Teste 5.5: Análise com Localização
```
"Quais estados têm maior receita por cliente?"
```

**Resultado esperado:**
- ✅ Chamar `get_vendas_por_estado`
- ✅ Analisar receita média por estado
- ✅ Identificar padrões regionais

---

## 📊 Checklist de Validação

Após executar os testes, valide:

### Banco de Dados ✓
- [ ] Banco `stack_overgol` está acessível
- [ ] Tabelas principais existem (dm_cliente_360, fato_vendas, etc)
- [ ] Dados estão presentes (não vazio)

### Ferramentas ✓
- [ ] Todas as 23 ferramentas retornam resultados
- [ ] Nenhuma ferramenta gera erro de SQL
- [ ] Resultados estão em formato JSON válido

### API ✓
- [ ] API Key é válida
- [ ] Conexão com OpenRouter funciona
- [ ] Rate limit não foi excedido

### Chatbot ✓
- [ ] Inicia sem erros
- [ ] Processa perguntas corretamente
- [ ] Identifica quando usar ferramentas
- [ ] Gera respostas estruturadas e úteis
- [ ] Trata erros graciosamente

### Respostas ✓
- [ ] Contêm resumo executivo
- [ ] Apresentam dados brutos
- [ ] Incluem análise contextual
- [ ] Fornecem recomendações
- [ ] Em português correto

## 🔍 Debug Mode

Se algo não estiver funcionando, ative o modo debug:

### Para DB:
```python
import sqlite3

# Adicione isto em tools.py após a conexão
cursor.execute("SELECT COUNT(*) as total FROM dm_cliente_360")
print(f"DEBUG: Clientes na 360: {cursor.fetchone()}")
```

### Para API:
```python
# Adicione isto em chatbot.py após a resposta
print(f"DEBUG API RESPONSE: {json.dumps(data, indent=2)}")
```

### Para Tools:
```python
# Adicione isto antes do return em cada função
print(f"DEBUG {fn_name}: {resultado}")
```

## 📈 Teste de Carga (Opcional)

Para testar performance com múltiplas perguntas:

```bash
python -c "
import time
from tools import available_tools

# Teste todas as ferramentas
start = time.time()
count = 0

for tool_name, tool_func in available_tools.items():
    try:
        result = tool_func()
        count += 1
    except:
        pass

end = time.time()

print(f'✅ {count}/{len(available_tools)} ferramentas executadas em {end-start:.2f}s')
print(f'   Média: {(end-start)/len(available_tools):.3f}s por ferramenta')
"
```

## 🔧 Troubleshooting

### Problema: "ModuleNotFoundError: No module named 'requests'"
**Solução:**
```bash
pip install requests
```

### Problema: "API_KEY não configurada"
**Solução:**
```bash
# Verifique se .env existe
ls -la | grep .env

# Se não existir, crie:
echo "API_KEY=sua_chave_aqui" > .env
```

### Problema: "Database not found: stack_overgol"
**Solução:**
```python
# Atualize DB_PATH em tools.py
DB_PATH = r'C:\caminho\completo\para\stack_overgol'  # Windows
DB_PATH = '/caminho/completo/para/stack_overgol'     # Linux/Mac
```

### Problema: "Connection timeout"
**Solução:**
```python
# Aumentar timeout em chatbot.py (linha ~65)
response = requests.post(url, headers=headers, json=payload, timeout=60)  # Aumentar de 30 para 60
```

### Problema: "Tool not found"
**Solução:**
```python
# Certifique-se que o tool está em available_tools
# Em tools.py:
available_tools = {
    "get_saude_financeira_geral": get_saude_financeira_geral,
    # ... etc
}
```

## ✨ Teste de Produção

Antes de colocar em produção, execute:

1. ✅ Todos os testes acima
2. ✅ Teste com dados reais por 1 hora
3. ✅ Monitore logs para erros
4. ✅ Teste com 10+ perguntas diferentes
5. ✅ Valide respostas para precisão
6. ✅ Verifique tempo de resposta

## 📝 Log de Testes

Mantenha um registro:

```
Data: 2024-12-15
Teste: Validação Completa
Status: ✅ PASSOU

Testes executados:
- Importações: ✅
- Banco de dados: ✅
- 23 ferramentas: ✅ (média 0.15s cada)
- API OpenRouter: ✅
- Chatbot manual: ✅ (10 testes)

Observações:
- Resposta média: 8 segundos
- Nenhum erro detectado
- Qualidade de respostas: Excelente
```

---

**Teste regularmente para manter a confiabilidade do sistema! 🚀**
