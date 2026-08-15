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
          <h1 className="titulo-pagina">Vendas</h1>
          <p className="mt-1 text-sm text-muted">
            {negocios.length} {negocios.length === 1 ? 'venda registrada' : 'vendas registradas'}
          </p>
        </div>
        <Link
          href="/admin/negocios/novo"
          className="btn btn-primary"
        >
          + Registrar venda
        </Link>
      </div>

      {registrado === '1' && (
        <p className="mt-5 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-100)] px-4 py-3 text-sm text-accent-700">
          Venda registrada. O carro já saiu do site.
        </p>
      )}

      {negocios.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-md)] border border-dashed border-[var(--color-divider)] px-6 py-12 text-center">
          <p className="text-text">Nenhuma venda registrada ainda.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {negocios.map((n) => (
            <li key={n.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/veiculos/${n.veiculoId}`}
                      className="font-medium text-text transition hover:text-accent-700"
                    >
                      {n.marca} {n.modelo} {n.versao ?? ''}{' '}
                      <span className="jj-num font-normal text-muted">{n.anoModelo}</span>
                    </Link>
                    {n.origem === 'consignado' && (
                      <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
                        Consignado
                      </span>
                    )}
                    {n.veiculoEntradaId && (
                      <span className="rounded bg-[var(--color-accent)]/15 px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-700">
                        Troca
                      </span>
                    )}
                  </div>

                  <p className="jj-num mt-1 text-sm text-muted">
                    {formatarData(n.data)}
                    {n.diasEmEstoque !== null && ` · ${n.diasEmEstoque} dias em estoque`}
                    {n.formaPagamento && (
                      <span className="font-sans"> · {ROTULO_FORMA_PAGAMENTO[n.formaPagamento]}</span>
                    )}
                  </p>

                  {n.compradorNome && (
                    <p className="mt-1 text-sm text-muted">
                      {n.compradorNome}
                      {n.compradorContato && ` · ${n.compradorContato}`}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="jj-num text-lg font-semibold text-text">
                    {formatarReaisCurto(n.valorVendaCentavos)}
                  </p>
                  <p className={`jj-num text-sm ${n.lucro >= 0 ? 'text-accent-700' : 'text-red-700'}`}>
                    {n.lucro >= 0 ? 'lucro ' : 'prejuízo '}
                    {formatarReais(Math.abs(n.lucro))}
                  </p>
                </div>
              </div>

              {n.veiculoEntradaId && (
                <p className="mt-3 border-t border-[var(--color-divider)] pt-3 text-sm text-muted">
                  Entrou um carro avaliado em{' '}
                  <span className="jj-num">{formatarReaisCurto(n.valorAvaliadoEntradaCentavos ?? 0)}</span> —{' '}
                  <Link
                    href={`/admin/veiculos/${n.veiculoEntradaId}`}
                    className="text-accent-700 transition hover:text-accent-700"
                  >
                    completar o cadastro dele
                  </Link>
                </p>
              )}

              {n.observacoes && (
                <p className="mt-3 border-t border-[var(--color-divider)] pt-3 text-sm text-muted">
                  {n.observacoes}
                </p>
              )}

              <form action={cancelarNegocioAcao} className="mt-3 border-t border-[var(--color-divider)] pt-3">
                <input type="hidden" name="id" value={n.id} />
                <button
                  type="submit"
                  className="text-xs text-muted transition hover:text-red-800"
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
