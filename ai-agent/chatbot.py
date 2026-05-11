import requests
import os
import json
from dotenv import load_dotenv
from tools import tools_definition, available_tools

load_dotenv()

# ==================== SUGESTÕES DE PERGUNTAS ====================
SUGGESTED_QUESTIONS = [
    "Qual é a saúde financeira geral da empresa?",
    "Quem são meus clientes VIP e qual o padrão deles?",
    "Quantos clientes estão em risco de churn?",
    "Qual categoria de produto é mais lucrativa?",
    "Como evoluiu meu ticket médio nos últimos meses?",
    "Qual é meu NPS e o que significa?",
    "Quais foram os 10 produtos mais vendidos este mês?",
    "Qual região teve o maior crescimento de receita?",
    "Como está a satisfação dos clientes?",
    "Qual método de pagamento é mais popular?"
]

# Mapeamento de ferramentas para descrições amigáveis
TOOL_DESCRIPTIONS = {
    "get_saude_financeira_geral": "Saúde Financeira Geral da Empresa",
    "get_ltv_por_cliente": "Lifetime Value (LTV) por Cliente",
    "get_ticket_medio_por_periodo": "Evolução do Ticket Médio",
    "get_clientes_por_localizacao": "Clientes por Localização",
    "count_clientes_por_localizacao": "Contagem de Clientes por Local",
    "get_distribuicao_clientes_por_localizacao": "Distribuição Geográfica de Clientes",
    "get_segmentacao_clientes_por_valor": "Segmentação de Clientes (VIP/Premium/Regular/Dormentes)",
    "get_clientes_com_maior_ltv": "Clientes com Maior LTV",
    "get_clientes_em_risco_churn": "Detecção de Clientes em Risco de Churn",
    "get_novos_clientes": "Novos Clientes",
    "get_receita_por_categoria": "Receita por Categoria de Produto",
    "get_metodos_pagamento_populares": "Métodos de Pagamento Populares",
    "get_status_pedidos_distribuicao": "Distribuição de Status de Pedidos",
    "get_vendas_por_estado": "Vendas por Estado",
    "get_nps_media": "NPS Médio (Net Promoter Score)",
    "get_satisfacao_por_cliente": "Satisfação por Cliente",
    "get_analise_tickets_suporte": "Análise de Tickets de Suporte",
    "get_engajamento_digital": "Métricas de Engajamento Digital",
    "get_comportamento_compra_por_origem": "Comportamento de Compra por Origem",
    "get_produtos_mais_vendidos": "Produtos Mais Vendidos",
    "get_produtos_menos_vendidos": "Produtos Menos Vendidos",
    "comparar_periodos": "Comparação de Períodos"
}

def get_tool_description(tool_name: str) -> str:
    """Retorna descrição amigável da ferramenta"""
    return TOOL_DESCRIPTIONS.get(tool_name, tool_name)

def simplify_tool_name(tool_name: str) -> str:
    """Simplifica nome da ferramenta para exibição"""
    desc = TOOL_DESCRIPTIONS.get(tool_name, tool_name)
    # Remove "de" ou "por" do início se existir
    return desc.replace("Análise de ", "").replace("de ", "").strip()

def format_args(args: dict) -> str:
    """Formata argumentos de forma legível"""
    if not args:
        return ""
    parts = []
    for k, v in args.items():
        if isinstance(v, str):
            parts.append(f"{k}='{v}'")
        else:
            parts.append(f"{k}={v}")
    return ", ".join(parts)


def show_welcome_menu():
    """Exibe menu de boas-vindas com sugestões"""
    print("\n" + "="*70)
    print("🔍 SISTEMA DE ANÁLISE DE DADOS - ANALISTA CRM STACK OVERGOL")
    print("="*70)
    print("\n📊 Bem-vindo! Sou seu assistente de análise de dados inteligente.")
    print("Respondo perguntas sobre vendas, clientes e estratégia.\n")
    
    print("💡 EXEMPLOS DE PERGUNTAS QUE POSSO RESPONDER:")
    print("-" * 70)
    for i, question in enumerate(SUGGESTED_QUESTIONS[:5], 1):
        print(f"  {i}. {question}")
    print()
    print("  ... e muitas outras! (Digite 'ajuda' para ver mais exemplos)")
    print("\n  Digite 'sair' para encerrar.\n")
    print("="*70 + "\n")


def show_help():
    """Exibe mensagem de ajuda com exemplos"""
    print("\n" + "="*70)
    print("💬 EXEMPLOS DE PERGUNTAS")
    print("="*70 + "\n")
    
    examples = {
        "SAÚDE FINANCEIRA": [
            "Como está a saúde financeira geral?",
            "Qual foi o crescimento nos últimos 3 meses?",
            "Qual é o LTV médio dos meus clientes?"
        ],
        "CLIENTES": [
            "Quem são meus clientes VIP?",
            "Quantos clientes estão em risco de churn?",
            "Qual estado tem maior receita por cliente?"
        ],
        "VENDAS": [
            "Qual categoria é mais lucrativa?",
            "Como evoluiu o ticket médio?",
            "Quais são os produtos best-sellers?"
        ],
        "SATISFAÇÃO": [
            "Qual é meu NPS?",
            "Como está a satisfação dos clientes?",
            "Qual é o tempo de resolução de suporte?"
        ]
    }
    
    for category, questions in examples.items():
        print(f"📌 {category}:")
        for q in questions:
            print(f"   • {q}")
        print()
    
    print("="*70 + "\n")


def run_analyst():
    """Main chatbot loop para análise de dados CRM"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000"
    }
    
    system_prompt = """Você é um Analista de Dados Sênior especializado em CRM e BI (Business Intelligence).

SUA MISSÃO:
Analisar dados de vendas, clientes e negócios para fornecer insights estratégicos que ajudem a empresa a entender sua saúde financeira.

ESCOPO DE DADOS DISPONÍVEIS:
- Informações de clientes (perfil, localização, histórico de compras)
- Dados de vendas (receita, produtos, categorias, datas)
- Métricas de satisfação (NPS, avaliações, suporte)
- Comportamento de engajamento (sessões, eventos)
- Segmentação de clientes (VIP, Premium, Regular, Dormentes)
- Análises por período, região, categoria, origem

ESTRUTURA DE RESPOSTA:
1. RESUMO EXECUTIVO: Resposta direta à pergunta em 1-2 linhas
2. DADOS PRINCIPAIS: Números brutos em formato claro (tabelas/listas)
3. ANÁLISE CONTEXTUAL: Interpretação (tendências, comparações, benchmarks)
4. RECOMENDAÇÕES: Ações baseadas nos insights
5. PRÓXIMOS PASSOS: Análises complementares recomendadas

TRANSPARÊNCIA - MUITO IMPORTANTE:
Sempre mencione QUAL INFORMAÇÃO foi consultada para responder:
- Se usou "clientes do Nordeste": mencione que consultou "clientes_por_estado"
- Se usou "produtos mais vendidos": mencione que consultou "produtos_mais_vendidos"
- Exemplo: "Os dados vêm da análise de clientes 360 e vendas de [período]"

RECONHECIMENTO DE ESCOPO:
Se a pergunta for sobre dados que NÃO existem (RH, financeiro, etc), RESPONDA CLARAMENTE:
"Desculpe, essa informação não está disponível. Tenho acesso apenas a dados de: vendas, 
clientes, satisfação e comportamento. Posso ajudar com algo nessa área?"

REGRAS DE RESPOSTA:
- Sempre em PORTUGUÊS BRASILEIRO, tom profissional mas amigável
- Valores monetários com 2 casas decimais (R$ X.XXX,XX)
- Percentuais com 1 casa decimal
- Se pergunta for vaga, peça clarificação: "Você quer de qual período? Qual região?"
- Respostas concisas mas completas
- Para seguimentos: use o contexto anterior quando fazer follow-ups
- Se a pergunta for sobre algo que não está no banco de dados informe que não tem acesso a essa informação, mas ofereça ajuda com os dados disponíveis."""
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Exibir menu de boas-vindas
    show_welcome_menu()

    while True:
        user_input = input("👤 Como posso lhe ajudar hoje? \n- ").strip()
        
        if not user_input:
            continue
        
        # Comandos especiais
        if user_input.lower() == "ajuda":
            show_help()
            continue
            
        if user_input.lower() in ["sair", "exit", "quit"]: 
            print("\n✅ Obrigado por usar o sistema! Até logo!")
            break

        messages.append({"role": "user", "content": user_input})

        print("\n⏳ Processando sua pergunta...\n")
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": messages,
            "tools": tools_definition,
            "tool_choice": "auto"
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            data = response.json()

            if "error" in data:
                error_msg = data.get('error', {}).get('message', 'Erro desconhecido')
                print(f"❌ ERRO DA API: {error_msg}\n")
                messages.pop()  # Remove a pergunta que causou erro
                continue

            if "choices" not in data:
                print(f"❌ ERRO: Resposta inesperada da API")
                messages.pop()
                continue

            message = data["choices"][0]["message"]

            # Caso 1: IA quer usar ferramentas
            if message.get("tool_calls"):
                messages.append(message)
                
                tools_used = []
                
                print("🔧 Consultando dados relevantes...\n")
                
                for tool_call in message["tool_calls"]:
                    fn_name = tool_call["function"]["name"]
                    fn_args_str = tool_call["function"]["arguments"]
                    
                    try:
                        fn_args = json.loads(fn_args_str)
                    except json.JSONDecodeError:
                        fn_args = {}
                    
                    # Log transparente da ferramenta usada
                    tool_description = get_tool_description(fn_name)
                    tools_used.append(fn_name)
                    
                    print(f"  📊 {tool_description}")
                    if fn_args:
                        print(f"     Filtros: {format_args(fn_args)}")
                    
                    if fn_name not in available_tools:
                        resultado = {"erro": f"Ferramenta {fn_name} não encontrada"}
                    else:
                        try:
                            resultado = available_tools[fn_name](**fn_args)
                        except Exception as e:
                            resultado = {"erro": f"Erro ao executar: {str(e)}"}
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "name": fn_name,
                        "content": json.dumps(resultado, ensure_ascii=False, default=str)
                    })

                print("\n📈 Gerando análise baseada nos dados consultados...\n")
                
                # Segunda chamada para gerar resposta final
                final_payload = {
                    "model": "openai/gpt-4o-mini",
                    "messages": messages,
                    "tools": tools_definition,
                    "tool_choice": "none"
                }

                final_response = requests.post(
                    url,
                    headers=headers,
                    json=final_payload,
                    timeout=30
                ).json()

                if "choices" not in final_response:
                    print(f"❌ ERRO ao gerar resposta final\n")
                    # Remove os últimos messages adicionados em caso de erro
                    messages = messages[:-2]
                    continue

                final_message = final_response["choices"][0]["message"]
                response_text = final_message.get("content", "")
                
                if response_text:
                    messages.append(final_message)
                    
                    # Exibir a resposta com indicação de dados consultados
                    print("="*70)
                    print(response_text)
                    print("="*70)
                    print(f"\n📍 Dados Consultados: {', '.join([simplify_tool_name(t) for t in tools_used])}")
                    print("="*70 + "\n")
                else:
                    print("❌ Nenhuma resposta gerada\n")
                    messages.pop()

            # Caso 2: IA responde direto (sem ferramentas)
            elif message.get("content"):
                response_text = message["content"]
                messages.append(message)
                
                print("="*70)
                print(response_text)
                print("="*70 + "\n")
            
            else:
                print("❌ Resposta inesperada da IA\n")
                messages.pop()

        except requests.exceptions.Timeout:
            print("❌ TIMEOUT: Requisição demorou muito (>30s). Tente novamente.\n")
            messages.pop()
        except requests.exceptions.RequestException as e:
            print(f"❌ ERRO DE CONEXÃO: {str(e)}\n")
            messages.pop()
        except json.JSONDecodeError as e:
            print(f"❌ ERRO ao processar resposta: {str(e)}\n")
            messages.pop()
        except Exception as e:
            print(f"❌ ERRO INESPERADO: {str(e)}\n")
            messages.pop()


if __name__ == "__main__":
    run_analyst()