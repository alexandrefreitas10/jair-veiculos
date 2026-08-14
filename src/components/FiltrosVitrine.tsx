'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CAMBIOS, COMBUSTIVEIS, ROTULO_CAMBIO, ROTULO_COMBUSTIVEL } from '@/lib/veiculos-tipos'

// Os filtros vivem na URL, não em estado interno. Isso é o que permite ao Jair
// mandar pelo WhatsApp um link já filtrado — "olha os automáticos até 50 mil" —
// e permite ao cliente voltar, recarregar e favoritar sem perder a busca.

const CAMPOS_SELECT =
  'w-full rounded-lg border border-grafite-700 bg-grafite-900 px-3 py-2.5 text-sm text-grafite-100 outline-none transition focus:border-ambar-500'

export function FiltrosVitrine({ marcas }: { marcas: string[] }) {
  const router = useRouter()
  const parametros = useSearchParams()
  const [aplicando, iniciarTransicao] = useTransition()
  const [aberto, setAberto] = useState(false)

  function alterar(campo: string, valor: string) {
    const novos = new URLSearchParams(parametros.toString())
    if (valor) novos.set(campo, valor)
    else novos.delete(campo)
    iniciarTransicao(() => {
      router.push(`/carros?${novos.toString()}`, { scroll: false })
    })
  }

  const valor = (campo: string) => parametros.get(campo) ?? ''
  const quantosAtivos = ['marca', 'cambio', 'combustivel', 'precoMax', 'anoMin', 'kmMax'].filter((c) =>
    parametros.get(c),
  ).length

  return (
    <div className="rounded-xl border border-grafite-800 bg-grafite-900">
      {/* No celular os filtros começam fechados: senão empurram os carros pra
          baixo da dobra, e carro é o que a pessoa veio ver. */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left lg:hidden"
      >
        <span className="font-medium text-grafite-100">
          Filtrar
          {quantosAtivos > 0 && (
            <span className="numero ml-2 rounded-md bg-ambar-500 px-1.5 py-0.5 text-xs font-semibold text-grafite-950">
              {quantosAtivos}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 fill-grafite-400 transition ${aberto ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="m12 15.4-6-6L7.4 8l4.6 4.6L16.6 8 18 9.4z" />
        </svg>
      </button>

      <div className={`${aberto ? 'block' : 'hidden'} p-4 pt-0 lg:block lg:pt-4`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="Marca">
            <select className={CAMPOS_SELECT} value={valor('marca')} onChange={(e) => alterar('marca', e.target.value)}>
              <option value="">Todas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Câmbio">
            <select className={CAMPOS_SELECT} value={valor('cambio')} onChange={(e) => alterar('cambio', e.target.value)}>
              <option value="">Qualquer</option>
              {CAMBIOS.map((c) => (
                <option key={c} value={c}>
                  {ROTULO_CAMBIO[c]}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Combustível">
            <select
              className={CAMPOS_SELECT}
              value={valor('combustivel')}
              onChange={(e) => alterar('combustivel', e.target.value)}
            >
              <option value="">Qualquer</option>
              {COMBUSTIVEIS.map((c) => (
                <option key={c} value={c}>
                  {ROTULO_COMBUSTIVEL[c]}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Preço até">
            <select
              className={CAMPOS_SELECT}
              value={valor('precoMax')}
              onChange={(e) => alterar('precoMax', e.target.value)}
            >
              <option value="">Sem limite</option>
              <option value="3000000">R$ 30.000</option>
              <option value="5000000">R$ 50.000</option>
              <option value="7000000">R$ 70.000</option>
              <option value="10000000">R$ 100.000</option>
              <option value="15000000">R$ 150.000</option>
            </select>
          </Campo>

          <Campo rotulo="Ano a partir de">
            <select className={CAMPOS_SELECT} value={valor('anoMin')} onChange={(e) => alterar('anoMin', e.target.value)}>
              <option value="">Qualquer</option>
              {anosRecentes().map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Km até">
            <select className={CAMPOS_SELECT} value={valor('kmMax')} onChange={(e) => alterar('kmMax', e.target.value)}>
              <option value="">Sem limite</option>
              <option value="30000">30.000 km</option>
              <option value="60000">60.000 km</option>
              <option value="100000">100.000 km</option>
              <option value="150000">150.000 km</option>
            </select>
          </Campo>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-grafite-800 pt-4">
          <div className="flex items-center gap-2">
            <span className="etiqueta">Ordenar</span>
            <select
              className="rounded-lg border border-grafite-700 bg-grafite-900 px-2.5 py-1.5 text-sm text-grafite-100 outline-none focus:border-ambar-500"
              value={valor('ordem')}
              onChange={(e) => alterar('ordem', e.target.value)}
            >
              <option value="">Mais recentes</option>
              <option value="preco_asc">Menor preço</option>
              <option value="preco_desc">Maior preço</option>
              <option value="km_asc">Menor km</option>
            </select>
          </div>

          {quantosAtivos > 0 && (
            <button
              type="button"
              onClick={() => iniciarTransicao(() => router.push('/carros', { scroll: false }))}
              className="text-sm text-grafite-400 underline underline-offset-4 transition hover:text-ambar-400"
            >
              Limpar filtros
            </button>
          )}

          {aplicando && <span className="etiqueta">buscando…</span>}
        </div>
      </div>
    </div>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="etiqueta mb-1.5 block">{rotulo}</span>
      {children}
    </label>
  )
}

function anosRecentes(): number[] {
  const atual = new Date().getFullYear()
  return Array.from({ length: 16 }, (_, i) => atual + 1 - i)
}
