import { UserCircle, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'

function App() {
  return (
    <div className="min-h-screen p-10">

      {/* Cabeçalho */}
      <header className="text-center mb-10">
        <h1 className="text-primary">Stack OverGol</h1>
        <p className="text-body-2 text-gray-500">Melhor CRM do RocketLab</p>
      </header>



      {/*TESTE*/}


      <main className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* Forma base sem intent (cor/proposito) e com cada variant (forma)*/}
        <section>
          <h2 className="mb-4">Forma base</h2>
          <div className="bg-primary p-6 rounded-xl flex gap-3">
            <Button>Salvar</Button>           {/* filled é o default */}
            <Button variant="outlined">Cancelar</Button> {/* com variante */}
            <Button variant="ghost">Voltar</Button>
          </div>
        </section>

        {/* Tamanhos prop size: sm ou md (default) ou lg */}
        <section>
          <h2 className="mb-4">Tamanhos</h2>
          <div className="bg-primary p-6 rounded-xl flex items-center gap-3"> {/*items center pra comparar os tamanhos*/}
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Ícone e dropdown leftIcon recebe um ícone do lucide-react, dropdown é booleano */}
        <section>
          <h2 className="mb-4">Ícone e dropdown</h2>
          <div className="bg-primary p-6 rounded-xl flex gap-3">
            <Button leftIcon={<UserCircle />}>Perfil</Button>
            <Button dropdown>Opções</Button>
            <Button leftIcon={<UserCircle />} dropdown>Conta</Button>
          </div>
        </section>

        {/* Intent: override opcional de cor (success, action, primary, secondary, error, warning) */}
        <section>
          <h2 className="mb-4">Intent (override de cor)</h2>
          <div className="bg-white border border-gray-200 p-6 rounded-xl flex gap-3">
            <Button intent="error" leftIcon={<Trash2 />}>Excluir</Button>
            <Button variant="outlined" intent="warning" leftIcon={<AlertTriangle />}>
              Atenção
            </Button>
            <Button variant="ghost" intent="action">Saiba mais</Button>
          </div>
        </section>

      </main>
    </div>
  )
}

export default App
