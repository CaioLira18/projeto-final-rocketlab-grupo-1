# ----------chatbot.py — Interface de linha de comando (CLI) do agente----------

# RESPONSABILIDADE DESTE ARQUIVO:
# Servir como interface de teste do agente de IA via terminal.
# Permite conversar com o agente sem precisar subir o backend ou o frontend.

# COMO USAR:
# 1. Pegue uma chave da API do Gemini em https://aistudio.google.com/apikey
# 2. Crie o arquivo ai-agent/.env com: GEMINI_API_KEY=sua_chave
# 3. Instale as dependências do agente: pip install -r ai-agent/requirements.txt
# 4. Garanta que o banco Gold está populado (se não estiver, rode: python backend/bd/seed.py)
# 5. Execute: python ai-agent/chatbot.py

# RELAÇÃO COM O AGENTE:
# Este arquivo NÃO contém a lógica do agente. Ele apenas importa o objeto "agent" que já foi criado em backend/app/services/chat_service.py

# TROUBLESHOOTING (erros comuns enfrentados durante o desenvolvimento):
# 1. "ModuleNotFoundError: No module named 'sqlalchemy'"
#    Causa: importar via "from app.services.chat_service" aciona o __init__.py da pasta services, que carrega todos os outros serviços do backend e suas dependências.
#    Solução: este arquivo já importa diretamente "from chat_service" via sys.path, evitando o __init__.py.
# 2. "TypeError: GeminiModel.__init__() got an unexpected keyword argument 'api_key'"
#    Causa: PydanticAI 1.94+ não aceita api_key como parâmetro do GeminiModel.
#    Solução: a chave é lida automaticamente da variável de ambiente GEMINI_API_KEY (já tratado em chat_service.py).
# 3. "TypeError: GenerateSchema.__init__() missing 1 required positional argument: 'types_namespace'"
#    Causa: backend/requirements.txt pinou pydantic==2.9.0, incompatível com pydantic-ai >= 1.94 (que exige pydantic >= 2.12).
#    Solução: o requirements.txt deste projeto força pydantic>=2.12. Se rodou o requirements do backend depois, execute: pip install "pydantic>=2.12"

import sys
import os
import asyncio

# ----------AJUSTE DE CAMINHO----------
# Aponta direto para backend/app/services/ para importar só o chat_service, sem acionar o __init__.py que carregaria SQLAlchemy e outros serviços desnecessários aqui.
_SERVICES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "app", "services"))
sys.path.insert(0, _SERVICES_DIR)

from dotenv import load_dotenv
load_dotenv()  # Carrega GEMINI_API_KEY e outras variáveis do arquivo .env

from chat_service import agent  # O agente já configurado com Gemini

# ----------SUGESTÕES DE PERGUNTAS----------
# Mostradas na tela de boas-vindas para orientar o usuário sobre o que perguntar.
SUGGESTED_QUESTIONS = [
    "Qual é a saúde financeira geral da empresa?",
    "Quem são os clientes com maior LTV?",
    "Quantos clientes estão em risco de churn?",
    "Qual categoria de produto é mais lucrativa?",
    "Como evoluiu o ticket médio nos últimos meses?",
    "Qual é o NPS médio da empresa?",
    "Quais foram os 10 produtos mais vendidos?",
    "Qual estado tem maior receita?",
]


def show_welcome():
    """Exibe o menu inicial com exemplos de perguntas."""
    print("\n" + "-" * 65)
    print("  ANALISTA CRM - STACK OVERGOL  (powered by Gemini - For Now)")
    print("-" * 65)
    print("\nExemplos de perguntas:")
    for i, q in enumerate(SUGGESTED_QUESTIONS, 1):
        print(f"  {i}. {q}")
    print("\n  Digite 'sair' para encerrar.\n")
    print("-" * 65 + "\n")


async def run():
    """
    Loop principal da conversa.

    Fluxo a cada mensagem:
      1. Lê o input do usuário
      2. Passa para agent.run() junto com o histórico da conversa
      3. O agente (Gemini) processa, chama ferramentas se necessário, e responde
      4. O histórico é atualizado para manter o contexto nas próximas perguntas
    """
    show_welcome()

    # ----------HISTÓRICO DE CONVERSA----------
    # O histórico guarda todas as mensagens trocadas (usuário + agente + ferramentas).
    # É passado ao agente a cada nova pergunta para que ele lembre o contexto anterior.
    history = []

    while True:
        try:
            user_input = input("Você: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nAté logo!")
            break

        if not user_input:
            continue  # Ignora linhas vazias

        if user_input.lower() in ("sair", "exit", "quit"):
            print("Até logo!")
            break

        print("\nAnalisando...\n")
        try:
            # ----------CHAMADA AO AGENTE----------
            # agent.run() dispara o loop interno do PydanticAI:
            # - Envia a pergunta + histórico ao Gemini
            # - O Gemini decide se chama ferramentas (ver_schema, executar_sql)
            # - Cada resultado de ferramenta volta para o Gemini continuar
            # - Quando o Gemini termina, result.data contém a resposta final
            result = await agent.run(user_input, message_history=history)

            # Atualiza o histórico com todas as mensagens desta rodada (pergunta, chamadas de ferramentas, respostas do modelo)
            history = list(result.all_messages())

            print(f"Assistente: {result.data}\n")

        except Exception as e:
            print(f"Erro: {e}\n")


if __name__ == "__main__":
    # asyncio.run() é necessário porque agent.run() é uma função assíncrona
    asyncio.run(run())
