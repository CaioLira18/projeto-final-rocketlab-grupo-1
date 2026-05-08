import requests
import os
import json
from dotenv import load_dotenv
from tools import tools_definition, available_tools

load_dotenv()

def run_analyst():
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000"
    }
    
    messages = [{
        "role": "system", 
        "content": """Você é um Analista de Dados de um CRM. 
        REGRAS DE RESPOSTA:
        1. Para cada resposta, apresente os dados brutos calculados e caso seja solicitado explicitamente adicione um parágrafo curto de 'INSIGHT TÉCNICO' baseado exclusivamente nesses números.
        2. Use terminologia técnica se necessário, porém priorize termos de fácil entendimento para todos.
        3. Se a pergunta for muito genérica, solicite mais detalhes para refinar a resposta.
        4. Se a pergunta estiver fora do escopo de análise de dados, responda educadamente que não é possível ajudar.
        5. Responda de forma clara e objetiva, evitando rodeios ou informações irrelevantes e sempre em PORTUGUÊS.
        6. Se a pergunta envolver comparação, apresente os dados de cada uma das coisas que estão sendo comparadas de forma separada e clara, para facilitar a compreensão."""
    }]

    print("\n" + "="*50)
    print("SISTEMA DE ANÁLISE STACK OVERGOL")
    print("="*50 + "\n")

    while True:
        user_input = input(r"👤 Qual sua dúvida? ")
        
        if user_input.lower() in ["sair", "exit"]: 
            print("\nEncerrando sistema...")
            break

        messages.append({"role": "user", "content": user_input})

        print("\n--- [LOG] Verificando escopo da pergunta... ---")
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": messages,
            "tools": tools_definition,
            "tool_choice": "auto"
        }

        try:
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()

            if "choices" not in data:
                print(f"❌ ERRO DA API: {data.get('error', {}).get('message', 'Erro desconhecido')}")
                continue

            message = data["choices"][0]["message"]

            if message.get("tool_calls"):
                messages.append(message)
                
                for tool_call in message["tool_calls"]:
                    fn_name = tool_call["function"]["name"]
                    fn_args = json.loads(tool_call["function"]["arguments"])
                    
                    print(f"🔍 [TOOL] IA acessando ferramenta: {fn_name}")
                    print(f"📊 [SQL] Filtros aplicados: {fn_args}")
                    
                    resultado = available_tools[fn_name](**fn_args)
                    
                    print(f"✅ [DATA] Dados extraídos da tabela_geral.")

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "name": fn_name,
                        "content": json.dumps(resultado)
                    })

                print("--- [LOG] Processando cálculos e insight final... ---\n")
                
                final_payload = {
                    "model": "openai/gpt-4o-mini",
                    "messages": messages,
                    "tools": tools_definition,
                    "tool_choice": "none"
                }

                final_res = requests.post(
                    url,
                    headers=headers,
                    json=final_payload
                ).json()

                if "choices" not in final_res:
                    print(f"❌ ERRO FINAL API: {final_res}")
                    continue

                reply = final_res["choices"][0]["message"]["content"]
            else:
                reply = message["content"]

            print(f"🤖 IA ANALISTA CRM:\n{reply}")
            print("\n" + "="*60 + "\n") 
            
            messages.append({"role": "assistant", "content": reply})

        except Exception as e:
            print(f"⚠️ Erro inesperado: {e}")

if __name__ == "__main__":
    run_analyst()