import Link from 'next/link'
import { Cartao } from '@/components/admin/Cartao'
import { GraficoMensal } from '@/components/admin/GraficoMensal'
import { formatarReaisCurto } from '@/lib/dinheiro'
import { resumir, serieMensal, vendasNoPeriodo } from '@/lib/financeiro'
import { MESES, formatarData, mesAtualBrasilia, primeiroDiaDoMes, ultimoDiaDoMes } from '@/lib/periodo'
import { ROTULO_ORIGEM } from '@/lib/veiculos-tipos'

export const metadata = { title: 'Relatórios' }

/** 'AAAA-MM-DD' ou nada. Data inválida vira `null` em vez de ir pra consulta. */
function lerData(valor: string | undefined): string | null {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null
  return valor
}

export default async function Relatorios({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>
}) {
  const parametros = await searchParams
  const { ano, mes } = mesAtualBrasilia()

  // Sem filtro, mostra o mês corrente — é o que ele quer ver em nove de cada
  // dez visitas.
  const de = lerData(parametros.de) ?? primeiroDiaDoMes(ano, mes)
  const ate = lerData(parametros.ate) ?? ultimoDiaDoMes(ano, mes)

  const [vendas, serie] = await Promise.all([vendasNoPeriodo(de, ate), serieMensal(12)])
  const resumo = resumir(vendas)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker m-0">Relatórios</p>
          <h1 className="titulo-pagina mt-2">
            {formatarData(de)} a {formatarData(ate)}
          </h1>
        </div>

        {vendas.length > 0 && (
          <a href={`/admin/relatorios/csv?de=${de}&ate=${ate}`} className="btn btn-secondary">
            Baixar para Excel
          </a>
        )}
      </div>

      {/* GET simples: o período fica na URL, então ele pode favoritar o
          fechamento de um mês e voltar nele depois. */}
      <form method="get" className="card mt-5 !flex-row flex-wrap items-end gap-3">
        <div className="field">
          <label htmlFor="de">De</label>
          <input id="de" type="date" name="de" defaultValue={de} className="input jj-num" />
        </div>
        <div className="field">
          <label htmlFor="ate">Até</label>
          <input id="ate" type="date" name="ate" defaultValue={ate} className="input jj-num" />
        </div>
        <button type="submit" className="btn btn-primary">
          Aplicar
        </button>

        <div className="ml-auto flex flex-wrap gap-2">
          {[0, 1, 2].map((atras) => {
            const d = new Date(Date.UTC(ano, mes - 1 - atras, 1))
            const a = d.getUTCFullYear()
            const m = d.getUTCMonth() + 1
            return (
              <Link
                key={`${a}-${m}`}
                href={`/admin/relatorios?de=${primeiroDiaDoMes(a, m)}&ate=${ultimoDiaDoMes(a, m)}`}
                className="btn btn-secondary"
              >
                {MESES[m - 1]}
              </Link>
            )
          })}
        </div>
      </form>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] rounded-[var(--radius-md)] border border-[var(--color-divider)]">
        <Cartao
          primeira
          etiqueta="Lucro do período"
          valor={formatarReaisCurto(resumo.lucro)}
          tom={resumo.lucro < 0 ? 'negativo' : 'accent'}
        />
        <Cartao etiqueta="Vendas" valor={String(resumo.vendas)} />
        <Cartao
          etiqueta="Sua receita"
          valor={formatarReaisCurto(resumo.receita)}
          nota={`${formatarReaisCurto(resumo.volumeVendido)} movimentados`}
        />
        <Cartao
          etiqueta="Margem média"
          valor={resumo.margemMedia === null ? '—' : `${resumo.margemMedia.toFixed(1)}%`}
          nota={
            resumo.lucroMedio === null ? undefined : `${formatarReaisCurto(resumo.lucroMedio)} por carro`
          }
        />
      </div>

      <section className="card mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="card-title m-0">Lucro por mês</h2>
          <span className="kicker">últimos 12 meses</span>
        </div>
        <GraficoMensal dados={serie} />
      </section>

      {vendas.length === 0 ? (
        <p className="py-8 text-center text-muted">Nenhuma venda neste período.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Veículo</th>
                <th>Origem</th>
                <th className="text-right">Compra</th>
                <th className="text-right">Custos</th>
                <th className="text-right">Venda</th>
                <th className="text-right">Lucro</th>
                <th className="text-right">Margem</th>
                <th className="text-right">Dias</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.negocioId}>
                  <td className="whitespace-nowrap">{formatarData(v.data)}</td>
                  <td>
                    <Link
                      href={`/admin/veiculos/${v.veiculoId}`}
                      className="text-text no-underline hover:text-accent"
                    >
                      {v.marca} {v.modelo}
                    </Link>{' '}
                    <span className="text-muted">{v.anoModelo}</span>
                  </td>
                  <td className="text-muted">{ROTULO_ORIGEM[v.origem]}</td>
                  <td className="text-right">
                    {v.origem === 'consignado' ? '—' : formatarReaisCurto(v.valorCompraCentavos)}
                  </td>
                  <td className="text-right">{formatarReaisCurto(v.custosCentavos)}</td>
                  <td className="text-right">{formatarReaisCurto(v.valorVendaCentavos)}</td>
                  <td className={`text-right ${v.lucro < 0 ? 'text-red-700' : 'text-accent-700'}`}>
                    {formatarReaisCurto(v.lucro)}
                  </td>
                  <td className="text-right text-muted">
                    {v.margem === null ? '—' : `${v.margem.toFixed(0)}%`}
                  </td>
                  <td className="text-right text-muted">{v.diasEmEstoque ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--color-divider)]">
                <td colSpan={6} className="text-right text-muted">
                  Total
                </td>
                <td
                  className={`text-right font-semibold ${resumo.lucro < 0 ? 'text-red-700' : 'text-accent-700'}`}
                >
                  {formatarReaisCurto(resumo.lucro)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  )
}
