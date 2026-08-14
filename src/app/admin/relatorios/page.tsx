import Link from 'next/link'
import { Cartao } from '@/components/admin/Cartao'
import { formatarReais, formatarReaisCurto } from '@/lib/dinheiro'
import { resumir, vendasNoPeriodo } from '@/lib/financeiro'
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

  const vendas = await vendasNoPeriodo(de, ate)
  const resumo = resumir(vendas)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-grafite-50">Relatórios</h1>
          <p className="mt-1 text-sm text-grafite-400">
            {formatarData(de)} a {formatarData(ate)}
          </p>
        </div>

        {vendas.length > 0 && (
          <a
            href={`/admin/relatorios/csv?de=${de}&ate=${ate}`}
            className="rounded-lg border border-grafite-700 px-4 py-2.5 text-sm font-medium text-grafite-200 transition hover:border-grafite-600"
          >
            Baixar para Excel
          </a>
        )}
      </div>

      {/* Formulário simples com GET: o período fica na URL, então ele pode
          favoritar o fechamento de um mês e voltar nele depois. */}
      <form method="get" className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-grafite-800 bg-grafite-900 p-4">
        <label className="block">
          <span className="etiqueta mb-1.5 block">De</span>
          <input
            type="date"
            name="de"
            defaultValue={de}
            className="numero rounded-lg border border-grafite-700 bg-grafite-950 px-3 py-2 text-grafite-100 outline-none focus:border-ambar-500"
          />
        </label>
        <label className="block">
          <span className="etiqueta mb-1.5 block">Até</span>
          <input
            type="date"
            name="ate"
            defaultValue={ate}
            className="numero rounded-lg border border-grafite-700 bg-grafite-950 px-3 py-2 text-grafite-100 outline-none focus:border-ambar-500"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-grafite-100 px-4 py-2 font-medium text-grafite-950 transition hover:bg-white"
        >
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
                className="rounded-lg border border-grafite-700 px-3 py-2 text-sm text-grafite-300 transition hover:border-grafite-600"
              >
                {MESES[m - 1]}
              </Link>
            )
          })}
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao
          etiqueta="Lucro do período"
          valor={formatarReais(resumo.lucro)}
          tom={resumo.lucro > 0 ? 'positivo' : resumo.lucro < 0 ? 'negativo' : 'neutro'}
        />
        <Cartao etiqueta="Vendas" valor={String(resumo.vendas)} />
        <Cartao
          etiqueta="Sua receita"
          valor={formatarReaisCurto(resumo.receita)}
          detalhe={`${formatarReaisCurto(resumo.volumeVendido)} movimentados`}
        />
        <Cartao
          etiqueta="Margem média"
          valor={resumo.margemMedia === null ? '—' : `${resumo.margemMedia.toFixed(1)}%`}
          detalhe={resumo.lucroMedio === null ? undefined : `${formatarReaisCurto(resumo.lucroMedio)} por carro`}
        />
      </div>

      {vendas.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-grafite-700 px-6 py-16 text-center">
          <p className="text-grafite-200">Nenhuma venda neste período.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-grafite-800">
          <table className="w-full min-w-3xl text-sm">
            <thead className="bg-grafite-900">
              <tr>
                <Th>Data</Th>
                <Th>Veículo</Th>
                <Th>Origem</Th>
                <Th direita>Compra</Th>
                <Th direita>Custos</Th>
                <Th direita>Venda</Th>
                <Th direita>Lucro</Th>
                <Th direita>Margem</Th>
                <Th direita>Dias</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grafite-800 bg-grafite-950/40">
              {vendas.map((v) => (
                <tr key={v.negocioId} className="transition hover:bg-grafite-900/60">
                  <td className="numero whitespace-nowrap px-4 py-3 text-grafite-400">{formatarData(v.data)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/veiculos/${v.veiculoId}`} className="transition hover:text-ambar-400">
                      {v.marca} {v.modelo}
                    </Link>{' '}
                    <span className="numero text-grafite-600">{v.anoModelo}</span>
                  </td>
                  <td className="px-4 py-3 text-grafite-400">{ROTULO_ORIGEM[v.origem]}</td>
                  <td className="numero px-4 py-3 text-right text-grafite-400">
                    {v.origem === 'consignado' ? '—' : formatarReaisCurto(v.valorCompraCentavos)}
                  </td>
                  <td className="numero px-4 py-3 text-right text-grafite-400">
                    {formatarReaisCurto(v.custosCentavos)}
                  </td>
                  <td className="numero px-4 py-3 text-right text-grafite-200">
                    {formatarReaisCurto(v.valorVendaCentavos)}
                  </td>
                  <td className={`numero px-4 py-3 text-right font-medium ${v.lucro >= 0 ? 'text-conferido' : 'text-red-400'}`}>
                    {formatarReaisCurto(v.lucro)}
                  </td>
                  <td className="numero px-4 py-3 text-right text-grafite-400">
                    {v.margem === null ? '—' : `${v.margem.toFixed(0)}%`}
                  </td>
                  <td className="numero px-4 py-3 text-right text-grafite-500">
                    {v.diasEmEstoque ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-grafite-700 bg-grafite-900">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right font-medium text-grafite-300">
                  Total
                </td>
                <td className={`numero px-4 py-3 text-right font-semibold ${resumo.lucro >= 0 ? 'text-conferido' : 'text-red-400'}`}>
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

function Th({ children, direita }: { children: React.ReactNode; direita?: boolean }) {
  return (
    <th scope="col" className={`etiqueta whitespace-nowrap px-4 py-3 ${direita ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}
