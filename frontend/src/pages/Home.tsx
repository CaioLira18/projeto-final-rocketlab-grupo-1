export const Home = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-primary">Dashboard</h1>
        <p className="text-body-2 text-gray-500 mt-1">
          Acompanhamento em tempo real dos principais indicadores comerciais e de atendimento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI Cards (esqueletos vazios para integração) */}
        {[
          { title: "Receita Total", value: "R$ ---,---", desc: "Soma das vendas" },
          { title: "Volume de Vendas", value: "--- pedidos", desc: "Pedidos concluídos" },
          { title: "Clientes Ativos", value: "--- clientes", desc: "Na base nos últimos 90 dias" },
          { title: "Ticket Médio", value: "R$ ---,--", desc: "Valor médio por compra" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <span className="text-caption text-gray-500 uppercase font-semibold">{card.title}</span>
            <span className="text-h2 text-primary font-bold my-2">{card.value}</span>
            <span className="text-caption text-gray-400">{card.desc}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center h-64">
        <p className="text-body-1 text-gray-400 font-medium">
          Integração gráfica e estatísticas detalhadas em desenvolvimento...
        </p>
      </div>
    </div>
  )
}
