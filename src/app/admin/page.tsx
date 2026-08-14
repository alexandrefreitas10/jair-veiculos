import Link from 'next/link'
import { Cartao } from '@/components/admin/Cartao'
import { GraficoMensal } from '@/components/admin/GraficoMensal'
import { formatarReais, formatarReaisCurto } from '@/lib/dinheiro'
import { carrosParados, resumoDoMes, resumoEstoque, serieMensal } from '@/lib/financeiro'
import { MESES, mesAtualBrasilia } from '@/lib/periodo'

export default async function PainelFinanceiro() {
  const { ano, mes } = mesAtualBrasilia()

  const [doMes, estoque, serie, parados] = await Promise.all([
    resumoDoMes(ano, mes),
    resumoEstoque(),
    serieMensal(12),
    carrosParados(5),
  ])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-grafite-50">Painel</h1>
          <p className="mt-1 text-sm text-grafite-400">
            {MESES[mes - 1]} de {ano}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/veiculos/novo"
            className="rounded-lg bg-ambar-500 px-4 py-2.5 text-sm font-semibold text-grafite-950 transition hover:bg-ambar-400"
          >
            + Novo veículo
          </Link>
          <Link
            href="/admin/negocios/novo"
            className="rounded-lg border border-grafite-700 px-4 py-2.5 text-sm font-medium text-grafite-200 transition hover:border-grafite-600"
          >
            Registrar venda
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao
          etiqueta="Lucro do mês"
          valor={formatarReais(doMes.lucro)}
          detalhe={
            doMes.margemMedia === null ? 'sem vendas ainda' : `margem de ${doMes.margemMedia.toFixed(1)}%`
          }
          tom={doMes.lucro > 0 ? 'positivo' : doMes.lucro < 0 ? 'negativo' : 'neutro'}
        />
        <Cartao
          etiqueta="Vendas no mês"
          valor={String(doMes.vendas)}
          detalhe={
            doMes.vendas > 0 ? `${formatarReaisCurto(doMes.volumeVendido)} movimentados` : 'nenhuma ainda'
          }
        />
        <Cartao
          etiqueta="Capital parado"
          valor={formatarReaisCurto(estoque.capitalParado)}
          detalhe={`em ${estoque.quantidade} ${estoque.quantidade === 1 ? 'carro' : 'carros'}${
            estoque.consignados > 0 ? ` (${estoque.consignados} consignado)` : ''
          }`}
          tom="destaque"
        />
        <Cartao
          etiqueta="Giro médio"
          valor={doMes.giroMedioDias === null ? '—' : `${doMes.giroMedioDias} dias`}
          detalhe="da entrada até a venda"
        />
      </div>

      <section className="mt-8 rounded-xl border border-grafite-800 bg-grafite-900 p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display font-semibold text-grafite-50">Lucro por mês</h2>
          <span className="etiqueta">últimos 12 meses</span>
        </div>
        <GraficoMensal dados={serie} />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display font-semibold text-grafite-50">Parados há mais tempo</h2>
          <Link href="/admin/veiculos" className="text-sm text-ambar-400 transition hover:text-ambar-300">
            Ver estoque →
          </Link>
        </div>

        {parados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-grafite-700 px-5 py-10 text-center text-sm text-grafite-500">
            Nenhum carro publicado no momento.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-grafite-800">
            <table className="w-full text-sm">
              <thead className="bg-grafite-900">
                <tr>
                  <Th>Veículo</Th>
                  <Th alinhar="direita">Parado há</Th>
                  <Th alinhar="direita" esconderNoCelular>
                    Investido
                  </Th>
                  <Th alinhar="direita">Anunciado</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grafite-800 bg-grafite-950/40">
                {parados.map((c) => (
                  <tr key={c.veiculoId} className="transition hover:bg-grafite-900/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/veiculos/${c.veiculoId}`} className="transition hover:text-ambar-400">
                        {c.marca} {c.modelo}{' '}
                        <span className="numero text-grafite-500">{c.anoModelo}</span>
                      </Link>
                    </td>
                    <td
                      className={`numero px-4 py-3 text-right ${
                        // Passou de dois meses, o dinheiro está preso tempo
                        // demais — e é isso que dói em quem revende.
                        c.diasParado > 60 ? 'text-ambar-400' : 'text-grafite-300'
                      }`}
                    >
                      {c.diasParado} dias
                    </td>
                    <td className="numero hidden px-4 py-3 text-right text-grafite-400 sm:table-cell">
                      {formatarReaisCurto(c.capitalCentavos)}
                    </td>
                    <td className="numero px-4 py-3 text-right text-grafite-200">
                      {formatarReaisCurto(c.precoCentavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function Th({
  children,
  alinhar = 'esquerda',
  esconderNoCelular,
}: {
  children: React.ReactNode
  alinhar?: 'esquerda' | 'direita'
  esconderNoCelular?: boolean
}) {
  return (
    <th
      scope="col"
      className={`etiqueta px-4 py-3 ${alinhar === 'direita' ? 'text-right' : 'text-left'} ${
        esconderNoCelular ? 'hidden sm:table-cell' : ''
      }`}
    >
      {children}
    </th>
  )
}
