import { useState, useRef, useEffect } from 'react'
import { Send, Bot } from 'lucide-react'
import { Button } from '@/components/ui'
import { apiFetch } from '@/services'
import { useAuth } from '@/context'
import { cn } from '@/utils/cn'

// ----------------- CONSTANTES -----------------

// Chave do localStorage onde guardamos o id da conversa atual
const SESSION_KEY = 'chat_session_id'

// Fallback usado se o GET /chat/suggestions falhar (rede, 401, etc.).
// Em condições normais a lista vem do backend, mantendo a fonte da verdade lá.
const FALLBACK_SUGGESTED_QUESTIONS = [
  'Qual é a saúde financeira geral da empresa?',
  'Quem são os clientes VIP?',
  'Quantos clientes estão em risco de churn?',
  'Qual categoria de produto gera mais receita?',
  'Como evoluiu o ticket médio nos últimos 12 meses?',
  'Qual é o NPS médio?',
  'Qual estado teve maior receita?',
  'Qual método de pagamento é mais utilizado?',
  'Quais são os 5 produtos com maior receita total?',
]

// ----------------- TIPOS -----------------

type Role = 'user' | 'assistant'

interface Message {
  id: string       // gerado no cliente só pra servir de key do React
  role: Role
  content: string
}

// ----------------- HELPERS -----------------
// Retorna o session_id atual, criando um novo na primeira chamada.
// Fora do componente pra poder ser chamada na inicialização do useRef.
function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// ----------------- COMPONENTE PRINCIPAL -----------------
export function AiAgent() {
  const { user } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(FALLBACK_SUGGESTED_QUESTIONS)

  // useRef em vez de useState: o session_id muda, mas não deve causar re-render
  const sessionId = useRef(getOrCreateSessionId())

  // Sentinela no fim da lista, usado para o auto-scroll
  const bottomRef = useRef<HTMLDivElement>(null)

  // Usado pra resetar altura e devolver foco depois do envio
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scrolla pro final ao chegar mensagem nova ou quando o typing indicator aparece
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Busca a lista oficial de sugestões do backend. Se falhar, fica com o fallback.
  // O backend é a fonte da verdade pra equipe poder atualizar perguntas sem rebuild do front.
  useEffect(() => {
    let cancelled = false
    apiFetch<{ suggestions: string[] }>('/chat/suggestions')
      .then((data) => {
        if (!cancelled && Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
          setSuggestedQuestions(data.suggestions)
        }
      })
      .catch(() => {
        // silencioso: já temos fallback hard-coded
      })
    return () => { cancelled = true }
  }, [])

  function resetTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  // Envia a pergunta ao backend e adiciona a resposta na lista.
  // O histórico real fica no backend, atrelado ao session_id.
  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    // Adiciona a bolha do usuário imediatamente (feedback instantâneo, sem esperar a API)
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    resetTextareaHeight()
    setIsLoading(true)

    // Conexão com o agente
    try {
      const data = await apiFetch<{ response: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId.current, message: trimmed }),
      })
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.response }])
    } catch {
      // Erro de rede ou 500: mostra mensagem genérica como bubble do assistant
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.' },
      ])
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  // Enter envia, Shift+Enter quebra linha (padrão de chats)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Gera um session_id novo, descartando o contexto que o backend lembrava
  function handleNewConversation() {
    const newId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, newId)
    sessionId.current = newId
    setMessages([])
    setInput('')
    resetTextareaHeight()
  }

  // Inicial do username pro avatar; fallback "V" (V-Commerce)
  const userInitial = user?.username?.[0]?.toUpperCase() ?? 'V'
  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-5rem)]">
      {/* Header - título + botão "Nova conversa" só quando há mensagens */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-h1 text-primary font-heading">Agente IA</h1>
          <p className="text-body-2 text-gray-500 mt-1">
            Analista de dados inteligente - faça perguntas sobre clientes, vendas, produtos e mais.
          </p>
        </div>
        {!isEmpty && (
          <Button variant="outlined" intent="secondary" size="sm" onClick={handleNewConversation}>
            Nova conversa
          </Button>
        )}
      </div>

      {/* Card branco que ocupa o resto da tela */}
      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">

        {/* Lista de mensagens com scroll interno */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isEmpty ? (
            // Tela inicial: boas-vindas + grid de perguntas sugeridas
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="bg-secondary/10 p-4 rounded-2xl mb-4">
                <Bot className="h-10 w-10 text-secondary" />
              </div>
              <h2 className="text-h3 text-primary font-heading mb-1">Olá! Sou seu Analista CRM</h2>
              <p className="text-body-2 text-gray-500 mb-8 max-w-md">
                Posso responder perguntas sobre os dados da V-Commerce em linguagem natural. Por onde quer começar?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left px-4 py-3 rounded-lg border border-secondary-200 bg-secondary-50 text-body-2 text-secondary hover:bg-secondary-100 hover:border-secondary transition-colors duration-150"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Conversa em andamento: bolhas + typing indicator
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  // flex-row-reverse joga a bolha do user pra direita
                  className={cn('flex gap-3 items-end', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  {/* Avatar: inicial do user OU ícone Bot */}
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-caption',
                      msg.role === 'user' ? 'bg-primary' : 'bg-secondary',
                    )}
                  >
                    {msg.role === 'user' ? userInitial : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Bolha - whitespace-pre-wrap preserva quebras de linha do agente */}
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-3 rounded-xl text-body-2 leading-relaxed whitespace-pre-wrap wrap-break-word',
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-secondary-50 border border-secondary-200 text-gray-800 rounded-bl-sm',
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator - três bolinhas pulando com delay escalonado pra ilusão de onda */}
              {isLoading && (
                <div className="flex gap-3 items-end">
                  <div className="h-8 w-8 rounded-full bg-secondary shrink-0 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-secondary-50 border border-secondary-200 px-4 py-3 rounded-xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-5">
                      <span className="w-2 h-2 bg-secondary-300 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-secondary-300 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-secondary-300 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Sentinela do auto-scroll */}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input - textarea que cresce até 128px + botão de envio */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              // Auto-resize: zera height pra recalcular scrollHeight, depois aplica até o limite de 128px
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`
              }}
              placeholder="Faça uma pergunta sobre os dados da empresa..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-body-2 text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors min-h-10.5 max-h-32 disabled:opacity-60"
            />
            <Button
              intent="secondary"
              size="md"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              leftIcon={<Send />}
            >
              Enviar
            </Button>
          </div>
          <p className="text-caption text-gray-400 mt-2">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}

export default AiAgent
