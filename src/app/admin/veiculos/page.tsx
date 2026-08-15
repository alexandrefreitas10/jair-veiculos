import Link from 'next/link'
import { urlFoto } from '@/lib/armazenamento'
import { formatarKm, formatarReaisCurto } from '@/lib/dinheiro'
import { listarVeiculos } from '@/lib/veiculos'
import { ESTADOS, ROTULO_ESTADO, ehEstado } from '@/lib/veiculos-tipos'

export const metadata = { title: 'Estoque' }

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
          <p className="kicker m-0">Pátio</p>
          <h1 className="titulo-pagina mt-2">Estoque</h1>
          <p className="m-0 text-[13px] text-muted">
            {veiculos.length} {veiculos.length === 1 ? 'veículo' : 'veículos'}
            {filtro ? ` em ${ROTULO_ESTADO[filtro].toLowerCase()}` : ' no total'}
          </p>
        </div>
        <Link href="/admin/veiculos/novo" className="btn btn-primary">
          + Lançar veículo
        </Link>
      </div>

      <div className="seg mt-5 flex-wrap">
        <Link
          href="/admin/veiculos"
          className="seg-opt no-underline"
          style={
            !filtro
              ? { color: 'var(--color-accent-700)', boxShadow: 'inset 0 0 0 1px var(--color-accent)' }
              : { color: 'inherit' }
          }
        >
          Todos
        </Link>
        {ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/admin/veiculos?estado=${e}`}
            className="seg-opt no-underline"
            style={
              filtro === e
                ? { color: 'var(--color-accent-700)', boxShadow: 'inset 0 0 0 1px var(--color-accent)' }
                : { color: 'inherit' }
            }
          >
            {ROTULO_ESTADO[e]}
          </Link>
        ))}
      </div>

      {veiculos.length === 0 ? (
        <p className="py-8 text-center text-muted">
          {filtro ? 'Nenhum veículo neste filtro.' : 'Nenhum veículo cadastrado ainda.'}
        </p>
      ) : (
        <ul className="mt-6 grid list-none gap-3 p-0">
          {veiculos.map((v) => (
            <li key={v.id}>
              <Link
                href={`/admin/veiculos/${v.id}`}
                className="card card-link !flex-row items-center gap-4 text-text no-underline"
              >
                <div className="plate hidden h-16 w-24 shrink-0 !border-4 sm:block">
                  {urlFoto(v.fotoCapa) && (
                    <img src={urlFoto(v.fotoCapa)!} alt="" className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="card-title">
                      {v.marca} {v.modelo}
                    </span>
                    <span className="tag tag-outline">{ROTULO_ESTADO[v.estado]}</span>
                    {v.origem === 'consignado' && <span className="tag tag-neutral">Consignado</span>}
                  </div>
                  <p className="jj-num m-0 truncate text-[12px] text-muted">
                    {v.anoFabricacao}/{v.anoModelo} · {formatarKm(v.km)}
                    {v.versao && <span className="font-sans"> · {v.versao}</span>}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="jj-num m-0 font-heading text-[17px] font-semibold">
                    {formatarReaisCurto(v.precoCentavos)}
                  </p>
                  {v.origem === 'proprio' && v.valorCompraCentavos !== null && (
                    <p className="jj-num m-0 text-[11px] text-muted">
                      pagou {formatarReaisCurto(v.valorCompraCentavos)}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
