import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { CardCarro } from '@/components/CardCarro'
import { FiltrosVitrine } from '@/components/FiltrosVitrine'
import { listarVitrine, marcasNaVitrine, type Filtros } from '@/lib/vitrine'
import { CAMBIOS, COMBUSTIVEIS } from '@/lib/veiculos-tipos'
import type { Cambio, Combustivel } from '@/lib/veiculos-tipos'

export const metadata: Metadata = {
  title: 'Estoque',
  description: 'Todos os carros disponíveis, com filtro por marca, preço, ano, km e câmbio.',
}

type Parametros = Record<string, string | string[] | undefined>

/** Traduz a URL em filtros.
 *
 *  Tudo que vem daqui é texto de fora e é tratado como suspeito: número que não
 *  é número vira `undefined`, e câmbio ou combustível fora da lista conhecida é
 *  descartado em vez de ir parar numa consulta. */
function lerFiltros(p: Parametros): Filtros {
  const texto = (chave: string): string | undefined => {
    const v = p[chave]
    const s = Array.isArray(v) ? v[0] : v
    return s && s.trim() ? s.trim() : undefined
  }

  const numero = (chave: string): number | undefined => {
    const s = texto(chave)
    if (!s) return undefined
    const n = Number(s)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }

  const cambio = texto('cambio')
  const combustivel = texto('combustivel')
  const ordem = texto('ordem')

  return {
    busca: texto('busca'),
    marca: texto('marca'),
    modelo: texto('modelo'),
    precoMin: numero('precoMin'),
    precoMax: numero('precoMax'),
    anoMin: numero('anoMin'),
    kmMax: numero('kmMax'),
    cambio: (CAMBIOS as readonly string[]).includes(cambio ?? '') ? (cambio as Cambio) : undefined,
    combustivel: (COMBUSTIVEIS as readonly string[]).includes(combustivel ?? '')
      ? (combustivel as Combustivel)
      : undefined,
    ordem: (['preco_asc', 'preco_desc', 'km_asc', 'recente'] as const).includes(
      ordem as 'preco_asc' | 'preco_desc' | 'km_asc' | 'recente',
    )
      ? (ordem as Filtros['ordem'])
      : undefined,
  }
}

export default async function PaginaCarros({
  searchParams,
}: {
  searchParams: Promise<Parametros>
}) {
  const parametros = await searchParams
  const filtros = lerFiltros(parametros)

  const [carros, marcas] = await Promise.all([listarVitrine(filtros), marcasNaVitrine()])

  return (
    <>
      <Cabecalho />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl font-black tracking-tight text-grafite-50">Estoque</h1>
        <p className="mt-1.5 text-grafite-400">
          {carros.length === 0
            ? 'Nenhum carro encontrado com esses filtros.'
            : `${carros.length} ${carros.length === 1 ? 'carro encontrado' : 'carros encontrados'}`}
          {filtros.busca && <span className="text-grafite-300"> para “{filtros.busca}”</span>}
        </p>

        <div className="mt-6">
          {/* useSearchParams exige Suspense — sem ele o build reclama e a rota
              inteira cai para renderização dinâmica sem avisar. */}
          <Suspense fallback={<div className="h-14 rounded-xl border border-grafite-800 bg-grafite-900" />}>
            <FiltrosVitrine marcas={marcas} />
          </Suspense>
        </div>

        {carros.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {carros.map((c, i) => (
              <CardCarro key={c.id} carro={c} indice={i} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-grafite-700 px-6 py-20 text-center">
            <p className="text-grafite-200">Nada por aqui com esses filtros.</p>
            <p className="mt-1.5 text-sm text-grafite-500">
              Tente afrouxar um deles — ou me chame no WhatsApp dizendo o que procura. Às vezes tenho
              algo chegando que ainda não foi anunciado.
            </p>
          </div>
        )}
      </main>

      <Rodape />
    </>
  )
}
