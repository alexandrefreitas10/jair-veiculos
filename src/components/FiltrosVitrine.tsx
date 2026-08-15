'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Search } from 'lucide-react'

// Filtros do handoff: busca, carroceria e ordenação. Vivem na URL, não em
// estado interno — é o que permite ao Jair mandar um link já filtrado pelo
// WhatsApp ("olha os SUV até 70 mil") e ao cliente voltar sem perder a busca.

// Só as carrocerias do segmentado do handoff. A lista curta é proposital: um
// segmentado com oito opções vira um menu, e menu no celular não rola.
const CARROCERIAS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'suv', rotulo: 'SUV' },
  { valor: 'sedan', rotulo: 'Sedã' },
  { valor: 'hatch', rotulo: 'Hatch' },
  { valor: 'picape', rotulo: 'Picape' },
]

const ORDENS = [
  { valor: 'preco_asc', rotulo: 'Menor preço' },
  { valor: 'km_asc', rotulo: 'Menor km' },
  { valor: 'ano_desc', rotulo: 'Mais novo' },
]

export function FiltrosVitrine() {
  const router = useRouter()
  const parametros = useSearchParams()
  const [, iniciar] = useTransition()

  function alterar(campo: string, valor: string) {
    const novos = new URLSearchParams(parametros.toString())
    if (valor) novos.set(campo, valor)
    else novos.delete(campo)
    const busca = novos.toString()
    iniciar(() => router.push(busca ? `/carros?${busca}` : '/carros', { scroll: false }))
  }

  const atual = (campo: string) => parametros.get(campo) ?? ''

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative">
        <Search
          aria-hidden="true"
          size={15}
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          className="input w-[240px] pl-8"
          placeholder="ex. Corolla XEi"
          aria-label="Buscar por marca ou modelo"
          defaultValue={atual('busca')}
          // Busca ao soltar a tecla Enter ou ao sair do campo: a cada tecla
          // seriam consultas demais ao banco por uma palavra digitada.
          onKeyDown={(e) => {
            if (e.key === 'Enter') alterar('busca', (e.target as HTMLInputElement).value)
          }}
          onBlur={(e) => alterar('busca', e.target.value)}
        />
      </div>

      <Segmentado
        nome="carroceria"
        opcoes={CARROCERIAS}
        valor={atual('carroceria')}
        aoMudar={(v) => alterar('carroceria', v)}
      />

      <div className="ml-auto">
        <Segmentado
          nome="ordem"
          opcoes={ORDENS}
          valor={atual('ordem') || 'preco_asc'}
          aoMudar={(v) => alterar('ordem', v)}
        />
      </div>
    </div>
  )
}

function Segmentado({
  nome,
  opcoes,
  valor,
  aoMudar,
}: {
  nome: string
  opcoes: Array<{ valor: string; rotulo: string }>
  valor: string
  aoMudar: (v: string) => void
}) {
  return (
    <div className="seg" role="group">
      {opcoes.map((o) => (
        <label key={o.valor || 'todos'} className="seg-opt">
          <input
            type="radio"
            name={nome}
            value={o.valor}
            checked={valor === o.valor}
            onChange={() => aoMudar(o.valor)}
          />
          {o.rotulo}
        </label>
      ))}
    </div>
  )
}
