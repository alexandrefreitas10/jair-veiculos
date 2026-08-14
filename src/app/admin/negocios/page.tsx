import Link from 'next/link'
import { formatarReais, formatarReaisCurto } from '@/lib/dinheiro'
import { formatarData } from '@/lib/periodo'
import { listarNegocios } from '@/lib/negocios'
import { ROTULO_FORMA_PAGAMENTO } from '@/lib/veiculos-tipos'
import { cancelarNegocioAcao } from './acoes'

export const metadata = { title: 'Vendas' }

export default async function ListaVendas({
  searchParams,
}: {
  searchParams: Promise<{ registrado?: string }>
}) {
  const { registrado } = await searchParams
  const negocios = await listarNegocios()

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-grafite-50">Vendas</h1>
          <p className="mt-1 text-sm text-grafite-400">
            {negocios.length} {negocios.length === 1 ? 'venda registrada' : 'vendas registradas'}
          </p>
        </div>
        <Link
          href="/admin/negocios/novo"
          className="rounded-lg bg-ambar-500 px-4 py-2.5 text-sm font-semibold text-grafite-950 transition hover:bg-ambar-400"
        >
          + Registrar venda
        </Link>
      </div>

      {registrado === '1' && (
        <p className="mt-5 rounded-lg border border-conferido/30 bg-conferido/8 px-4 py-3 text-sm text-conferido">
          Venda registrada. O carro já saiu do site.
        </p>
      )}

      {negocios.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-grafite-700 px-6 py-16 text-center">
          <p className="text-grafite-200">Nenhuma venda registrada ainda.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {negocios.map((n) => (
            <li key={n.id} className="rounded-xl border border-grafite-800 bg-grafite-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/veiculos/${n.veiculoId}`}
                      className="font-medium text-grafite-50 transition hover:text-ambar-400"
                    >
                      {n.marca} {n.modelo} {n.versao ?? ''}{' '}
                      <span className="numero font-normal text-grafite-500">{n.anoModelo}</span>
                    </Link>
                    {n.origem === 'consignado' && (
                      <span className="rounded bg-grafite-800 px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-grafite-400">
                        Consignado
                      </span>
                    )}
                    {n.veiculoEntradaId && (
                      <span className="rounded bg-ambar-500/15 px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-ambar-300">
                        Troca
                      </span>
                    )}
                  </div>

                  <p className="numero mt-1 text-sm text-grafite-500">
                    {formatarData(n.data)}
                    {n.diasEmEstoque !== null && ` · ${n.diasEmEstoque} dias em estoque`}
                    {n.formaPagamento && (
                      <span className="font-sans"> · {ROTULO_FORMA_PAGAMENTO[n.formaPagamento]}</span>
                    )}
                  </p>

                  {n.compradorNome && (
                    <p className="mt-1 text-sm text-grafite-400">
                      {n.compradorNome}
                      {n.compradorContato && ` · ${n.compradorContato}`}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="numero text-lg font-semibold text-grafite-100">
                    {formatarReaisCurto(n.valorVendaCentavos)}
                  </p>
                  <p className={`numero text-sm ${n.lucro >= 0 ? 'text-conferido' : 'text-red-400'}`}>
                    {n.lucro >= 0 ? 'lucro ' : 'prejuízo '}
                    {formatarReais(Math.abs(n.lucro))}
                  </p>
                </div>
              </div>

              {n.veiculoEntradaId && (
                <p className="mt-3 border-t border-grafite-800 pt-3 text-sm text-grafite-400">
                  Entrou um carro avaliado em{' '}
                  <span className="numero">{formatarReaisCurto(n.valorAvaliadoEntradaCentavos ?? 0)}</span> —{' '}
                  <Link
                    href={`/admin/veiculos/${n.veiculoEntradaId}`}
                    className="text-ambar-400 transition hover:text-ambar-300"
                  >
                    completar o cadastro dele
                  </Link>
                </p>
              )}

              {n.observacoes && (
                <p className="mt-3 border-t border-grafite-800 pt-3 text-sm text-grafite-400">
                  {n.observacoes}
                </p>
              )}

              <form action={cancelarNegocioAcao} className="mt-3 border-t border-grafite-800 pt-3">
                <input type="hidden" name="id" value={n.id} />
                <button
                  type="submit"
                  className="text-xs text-grafite-600 transition hover:text-red-400"
                  // Cancelar devolve o carro pro site. O carro que entrou numa
                  // troca NÃO é apagado junto: quando ele percebe o engano, já
                  // pode ter fotografado e anunciado esse carro.
                  title="Desfaz a venda e devolve o carro para o site"
                >
                  Cancelar esta venda
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
