import { Suspense } from 'react'
import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { CardCarro } from '@/components/CardCarro'
import { FiltrosVitrine } from '@/components/FiltrosVitrine'
import { listarVitrine, type Filtros } from '@/lib/vitrine'
import { CAMBIOS, CARROCERIAS, COMBUSTIVEIS } from '@/lib/veiculos-tipos'
import type { Cambio, Carroceria, Combustivel } from '@/lib/veiculos-tipos'

// Renderiza a cada requisição. Sem isto o Next pré-renderiza no build e o
// estoque fica congelado no dia do deploy: o Jair publica um carro, atualiza a
// página e não vê nada mudar.
export const dynamic = 'force-dynamic'

type Parametros = Record<string, string | string[] | undefined>

/** Traduz a URL em filtros.
 *
 *  Tudo aqui é texto de fora e é tratado como suspeito: número que não é
 *  número vira `undefined`, e valor fora da lista conhecida é descartado em vez
 *  de ir parar numa consulta. */
export function lerFiltros(p: Parametros): Filtros {
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
  const daLista = <T extends string>(chave: string, lista: readonly T[]): T | undefined => {
    const v = texto(chave)
    return v && (lista as readonly string[]).includes(v) ? (v as T) : undefined
  }

  const ORDENS = ['preco_asc', 'preco_desc', 'km_asc', 'ano_desc', 'recente'] as const

  return {
    busca: texto('busca'),
    marca: texto('marca'),
    precoMin: numero('precoMin'),
    precoMax: numero('precoMax'),
    anoMin: numero('anoMin'),
    kmMax: numero('kmMax'),
    cambio: daLista<Cambio>('cambio', CAMBIOS),
    combustivel: daLista<Combustivel>('combustivel', COMBUSTIVEIS),
    carroceria: daLista<Carroceria>('carroceria', CARROCERIAS),
    ordem: daLista('ordem', ORDENS) ?? 'preco_asc',
  }
}

export default async function Vitrine({ searchParams }: { searchParams: Promise<Parametros> }) {
  const parametros = await searchParams
  const filtros = lerFiltros(parametros)
  const carros = await listarVitrine(filtros)

  return (
    <>
      <Cabecalho ativo="/carros" />

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        {/* Cabeçalho editorial: título à esquerda com medida curta pra quebrar
            em duas linhas, texto de apoio à direita alinhado pela base. */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[30ch]">
            <p className="kicker m-0">Estoque selecionado</p>
            <h1 className="mt-2">Carros revisados, procedência conferida.</h1>
          </div>
          <p className="m-0 max-w-[36ch] text-[14px] text-muted">
            Cada veículo passa por checagem de itens, laudo cautelar e conferência de documentação
            antes de entrar no pátio.
          </p>
        </div>

        <hr className="hr" />

        <Suspense fallback={<div className="h-[44px]" />}>
          <FiltrosVitrine />
        </Suspense>

        <p className="mt-4 mb-4 text-[12px] text-muted">
          {carros.length === 1 ? '1 veículo disponível' : `${carros.length} veículos disponíveis`}
        </p>

        {carros.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-4">
            {carros.map((c, i) => (
              <CardCarro key={c.id} carro={c} indice={i} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted">
            Nenhum veículo com esses filtros. Ajuste a busca ou fale com um consultor.
          </p>
        )}
      </main>

      <Rodape />
    </>
  )
}
