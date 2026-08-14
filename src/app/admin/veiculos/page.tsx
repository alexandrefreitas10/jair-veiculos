import Link from 'next/link'
import { urlFoto } from '@/lib/armazenamento'
import { formatarKm, formatarReaisCurto } from '@/lib/dinheiro'
import { listarVeiculos } from '@/lib/veiculos'
import { ESTADOS, ROTULO_ESTADO, ehEstado } from '@/lib/veiculos-tipos'
import type { Estado } from '@/lib/veiculos-tipos'

export const metadata = { title: 'Veículos' }

const COR_ESTADO: Record<Estado, string> = {
  rascunho: 'bg-grafite-700 text-grafite-200',
  disponivel: 'bg-conferido/15 text-conferido',
  reservado: 'bg-ambar-500/15 text-ambar-300',
  vendido: 'bg-grafite-800 text-grafite-400',
  arquivado: 'bg-grafite-800 text-grafite-500',
}

export default async function ListaVeiculos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const filtro = estado && ehEstado(estado) ? estado : undefined
  const veiculos = await listarVeiculos({ estado: filtro })

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-grafite-50">Veículos</h1>
          <p className="mt-1 text-sm text-grafite-400">
            {veiculos.length} {veiculos.length === 1 ? 'carro' : 'carros'}
            {filtro ? ` em ${ROTULO_ESTADO[filtro].toLowerCase()}` : ' no total'}
          </p>
        </div>
        <Link
          href="/admin/veiculos/novo"
          className="rounded-lg bg-ambar-500 px-4 py-2.5 text-sm font-semibold text-grafite-950 transition hover:bg-ambar-400"
        >
          + Novo veículo
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Aba href="/admin/veiculos" ativa={!filtro}>
          Todos
        </Aba>
        {ESTADOS.map((e) => (
          <Aba key={e} href={`/admin/veiculos?estado=${e}`} ativa={filtro === e}>
            {ROTULO_ESTADO[e]}
          </Aba>
        ))}
      </div>

      {veiculos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-grafite-700 px-6 py-16 text-center">
          <p className="text-grafite-200">Nenhum carro aqui.</p>
          <p className="mt-1.5 text-sm text-grafite-500">
            {filtro ? 'Tente outro filtro.' : 'Comece cadastrando o primeiro.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {veiculos.map((v) => {
            const capa = urlFoto(v.fotoCapa)
            return (
              <li key={v.id}>
                <Link
                  href={`/admin/veiculos/${v.id}`}
                  className="flex items-center gap-4 rounded-xl border border-grafite-800 bg-grafite-900 p-3 transition hover:border-grafite-600"
                >
                  <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-grafite-800 sm:block">
                    {capa && <img src={capa} alt="" className="h-full w-full object-cover" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-grafite-50">
                        {v.marca} {v.modelo}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider ${COR_ESTADO[v.estado]}`}>
                        {ROTULO_ESTADO[v.estado]}
                      </span>
                      {v.origem === 'consignado' && (
                        <span className="rounded bg-grafite-800 px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-grafite-400">
                          Consignado
                        </span>
                      )}
                    </div>
                    <p className="numero mt-1 truncate text-sm text-grafite-500">
                      {v.anoFabricacao}/{v.anoModelo} · {formatarKm(v.km)}
                      {v.versao && <span className="font-sans"> · {v.versao}</span>}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="numero font-semibold text-ambar-400">
                      {formatarReaisCurto(v.precoCentavos)}
                    </p>
                    {v.origem === 'proprio' && v.valorCompraCentavos !== null && (
                      <p className="numero mt-0.5 text-xs text-grafite-500">
                        pagou {formatarReaisCurto(v.valorCompraCentavos)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function Aba({ href, ativa, children }: { href: string; ativa: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm transition ${
        ativa
          ? 'bg-grafite-100 font-medium text-grafite-950'
          : 'border border-grafite-700 text-grafite-300 hover:border-grafite-600'
      }`}
    >
      {children}
    </Link>
  )
}
