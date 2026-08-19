import Link from 'next/link'
import { X } from 'lucide-react'
import { Cartao } from '@/components/admin/Cartao'
import { LancarCusto } from '@/components/admin/LancarCusto'
import { formatarReais, formatarReaisCurto, somar } from '@/lib/dinheiro'
import { livroDoPatio, precisaRevisarPreco, resumoDoMes, resumoEstoque } from '@/lib/financeiro'
import type { LinhaLivro } from '@/lib/financeiro'
import { formatarData, MESES, mesAtualBrasilia, ultimosMeses } from '@/lib/periodo'
import { listarCustos } from '@/lib/custos'
import { buscarVeiculo } from '@/lib/veiculos'
import { lancarCustoAcao, removerCustoAcao } from './veiculos/acoes'

export const metadata = { title: 'Livro do pátio' }

const FILTROS = ['Todos', 'Vendidos', 'Em estoque'] as const
type Filtro = (typeof FILTROS)[number]

export default async function LivroDoPatio({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; filtro?: string; veiculo?: string }>
}) {
  const p = await searchParams
  const atual = mesAtualBrasilia()

  // O mês vem da URL no formato AAAA-MM. Valor estranho cai no mês corrente em
  // vez de quebrar a tela.
  const meses = ultimosMeses(3)
  const chaveMes = meses.some((m) => m.chave === p.mes)
    ? p.mes!
    : `${atual.ano}-${String(atual.mes).padStart(2, '0')}`
  const [ano, mes] = chaveMes.split('-').map(Number)

  const filtro: Filtro = (FILTROS as readonly string[]).includes(p.filtro ?? '')
    ? (p.filtro as Filtro)
    : 'Todos'

  const [linhas, doMes, estoque] = await Promise.all([
    livroDoPatio(),
    resumoDoMes(ano, mes),
    resumoEstoque(),
  ])

  const visiveis = linhas.filter((l) =>
    filtro === 'Vendidos' ? l.vendido : filtro === 'Em estoque' ? !l.vendido : true,
  )

  const totais = {
    compra: somar(visiveis.map((l) => l.compraCentavos)),
    despesas: somar(visiveis.map((l) => l.despesasCentavos)),
    custo: somar(visiveis.map((l) => l.custoCentavos)),
    venda: somar(visiveis.map((l) => l.vendaCentavos)),
    lucro: somar(visiveis.map((l) => l.lucroCentavos)),
  }

  const selecionado = p.veiculo ? Number(p.veiculo) : null
  const linkBase = (extra: Record<string, string | null>) => {
    const q = new URLSearchParams({ mes: chaveMes, filtro })
    for (const [k, v] of Object.entries(extra)) {
      if (v === null) q.delete(k)
      else q.set(k, v)
    }
    return `/admin?${q.toString()}`
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[30ch]">
          <p className="kicker m-0">Livro do pátio</p>
          <h1 className="titulo-pagina mt-2">Quanto pagou, quanto gastou, por quanto vendeu.</h1>
        </div>

        <div className="seg">
          {meses.map((m) => (
            <Link
              key={m.chave}
              href={linkBase({ mes: m.chave, veiculo: null })}
              className="seg-opt no-underline"
              style={
                m.chave === chaveMes
                  ? { color: 'var(--color-accent-700)', boxShadow: 'inset 0 0 0 1px var(--color-accent)' }
                  : { color: 'inherit' }
              }
            >
              {MESES[m.mes - 1].slice(0, 3)} {m.ano}
            </Link>
          ))}
        </div>
      </div>

      {/* Faixa de indicadores: células separadas por hairline, não cards soltos. */}
      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] rounded-[var(--radius-md)] border border-[var(--color-divider)]">
        <Cartao
          primeira
          etiqueta="Vendido no mês"
          valor={formatarReaisCurto(doMes.volumeVendido)}
          nota={`${doMes.vendas} ${doMes.vendas === 1 ? 'veículo' : 'veículos'}`}
        />
        <Cartao
          etiqueta="Lucro do mês"
          valor={formatarReaisCurto(doMes.lucro)}
          nota={doMes.margemMedia === null ? 'sem vendas' : `${doMes.margemMedia.toFixed(1)}% sobre a venda`}
          tom={doMes.lucro < 0 ? 'negativo' : 'accent'}
        />
        <Cartao
          etiqueta="Lucro médio por carro"
          valor={doMes.lucroMedio === null ? '—' : formatarReaisCurto(doMes.lucroMedio)}
          nota="venda menos custo do carro"
        />
        <Cartao
          etiqueta="Investido em pátio"
          valor={formatarReaisCurto(estoque.capitalParado)}
          nota={`${estoque.quantidade} ${estoque.quantidade === 1 ? 'veículo parado' : 'veículos parados'}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="seg">
          {FILTROS.map((f) => (
            <Link
              key={f}
              href={linkBase({ filtro: f, veiculo: null })}
              className="seg-opt no-underline"
              style={
                f === filtro
                  ? { color: 'var(--color-accent-700)', boxShadow: 'inset 0 0 0 1px var(--color-accent)' }
                  : { color: 'inherit' }
              }
            >
              {f}
            </Link>
          ))}
        </div>

        <Link href="/admin/veiculos/novo" className="btn btn-primary">
          + Lançar veículo
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Veículo</th>
              <th className="hidden md:table-cell">Entrada</th>
              <th className="text-right">Compra</th>
              <th className="hidden text-right md:table-cell">Despesas</th>
              <th className="text-right">Custo total</th>
              <th className="text-right">Venda</th>
              <th className="text-right">Lucro</th>
              <th className="hidden text-right md:table-cell">Dias</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l) => (
              <tr key={l.veiculoId}>
                <td className="min-w-[180px]">
                  <Link href={linkBase({ veiculo: String(l.veiculoId) })} className="text-text no-underline">
                    <span className="block text-[15px]">
                      {l.marca} {l.modelo}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {l.anoFabricacao}/{l.anoModelo}
                      {l.finalPlaca && ` · final ${l.finalPlaca}`}
                    </span>
                  </Link>
                </td>
                <td className="hidden md:table-cell">{formatarData(l.dataEntrada)}</td>
                <td className="text-right">{formatarReaisCurto(l.compraCentavos)}</td>
                <td className="hidden text-right md:table-cell">
                  {formatarReaisCurto(l.despesasCentavos)}
                </td>
                <td className="text-right">{formatarReaisCurto(l.custoCentavos)}</td>
                <td className="text-right">{formatarReaisCurto(l.vendaCentavos)}</td>
                <td
                  className={`text-right ${l.lucroCentavos !== null && l.lucroCentavos < 0 ? 'text-red-700' : 'text-accent-700'}`}
                >
                  {formatarReaisCurto(l.lucroCentavos)}
                </td>
                <td className="hidden text-right md:table-cell">{l.dias}</td>
                <td>
                  <span className="tag tag-outline">{rotuloStatus(l)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-divider)]">
              <td className="text-[12px] text-muted">
                {visiveis.length} {visiveis.length === 1 ? 'veículo' : 'veículos'} no filtro
              </td>
              <td className="hidden md:table-cell" />
              <td className="text-right font-semibold">{formatarReaisCurto(totais.compra)}</td>
              <td className="hidden text-right font-semibold md:table-cell">
                {formatarReaisCurto(totais.despesas)}
              </td>
              <td className="text-right font-semibold">{formatarReaisCurto(totais.custo)}</td>
              <td className="text-right font-semibold">{formatarReaisCurto(totais.venda)}</td>
              <td className="text-right font-semibold text-accent-700">
                {formatarReaisCurto(totais.lucro)}
              </td>
              <td className="hidden md:table-cell" />
              <td />
            </tr>
          </tfoot>
        </table>

        {visiveis.length === 0 && (
          <p className="py-8 text-center text-muted">Nenhum veículo neste filtro.</p>
        )}
      </div>

      {selecionado !== null && (
        <Drawer veiculoId={selecionado} linhas={linhas} voltar={linkBase({ veiculo: null })} />
      )}
    </>
  )
}

function rotuloStatus(l: LinhaLivro): string {
  if (l.vendido) return 'Vendido'
  if (precisaRevisarPreco(l)) return 'Revisar preço'
  if (l.estado === 'rascunho') return 'Em preparação'
  if (l.estado === 'reservado') return 'Reservado'
  return 'Anunciado'
}

/**
 * Extrato do carro. Abre pela URL (`?veiculo=id`), não por estado no cliente:
 * assim o Jair pode recarregar a página ou mandar o link e o painel abre no
 * mesmo lugar — e funciona mesmo se o JavaScript falhar.
 */
async function Drawer({
  veiculoId,
  linhas,
  voltar,
}: {
  veiculoId: number
  linhas: LinhaLivro[]
  voltar: string
}) {
  const linha = linhas.find((l) => l.veiculoId === veiculoId)
  if (!linha) return null

  const [veiculo, custos] = await Promise.all([buscarVeiculo(veiculoId), listarCustos(veiculoId)])
  if (!veiculo) return null

  return (
    <>
      {/* Fundo escurecido: separa a gaveta do conteúdo e dá uma saída óbvia —
          clicar fora fecha, que é o que todo mundo tenta primeiro. */}
      <Link
        href={voltar}
        aria-label="Fechar extrato"
        className="fixed inset-0 z-10 bg-[color-mix(in_srgb,var(--color-neutral-900)_35%,transparent)]"
      />

      {/* Começa ABAIXO do cabeçalho fixo, não no topo da janela. Com
          `inset-y-0` a barra do painel cobria o nome do carro e o botão de
          fechar — a gaveta abria já decapitada. */}
      <aside className="elev-lg fixed right-0 bottom-0 z-20 w-[min(440px,100%)] overflow-auto border-l border-[var(--color-divider)] bg-bg p-4 top-[var(--altura-cabecalho)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kicker m-0">{linha.marca}</p>
          <h3 className="mt-1 !text-[25px]">{linha.modelo}</h3>
          <p className="m-0 text-[12px] text-muted">
            {linha.anoFabricacao}/{linha.anoModelo}
            {linha.finalPlaca && ` · final ${linha.finalPlaca}`} · entrada{' '}
            {formatarData(linha.dataEntrada)}
          </p>
        </div>
        <Link href={voltar} aria-label="Fechar" className="btn btn-secondary btn-icon">
          <X size={16} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="m-0 text-[10px] tracking-[0.1em] text-muted uppercase">Custo total</p>
          <p className="jj-num m-0 font-heading text-[28px] leading-none font-semibold">
            {formatarReaisCurto(linha.custoCentavos)}
          </p>
        </div>
        <div>
          <p className="m-0 text-[10px] tracking-[0.1em] text-muted uppercase">Lucro</p>
          <p
            className={`jj-num m-0 font-heading text-[28px] leading-none font-semibold ${
              linha.lucroCentavos !== null && linha.lucroCentavos < 0 ? 'text-red-700' : 'text-accent-700'
            }`}
          >
            {formatarReaisCurto(linha.lucroCentavos)}
          </p>
          {linha.lucroPercentual !== null && (
            <p className="m-0 text-[11px] text-muted">
              {linha.lucroPercentual.toFixed(1)}% sobre o custo
            </p>
          )}
        </div>
      </div>

      <hr className="hr" />

      <h4 className="!text-[16px]">Lançamentos</h4>
      <table className="table !text-[13px]">
        <tbody>
          {/* A aquisição é sempre o primeiro lançamento do livro. No banco ela
              mora numa coluna do veículo, não na tabela de custos — mas para
              quem lê o extrato ela é o primeiro gasto, e é assim que aparece. */}
          {veiculo.origem === 'proprio' && (
            <tr>
              <td>
                Compra do veículo
                <span className="block text-[11px] text-muted">
                  {formatarData(linha.dataEntrada)}
                </span>
              </td>
              <td className="text-right">{formatarReaisCurto(linha.compraCentavos)}</td>
              <td className="w-8" />
            </tr>
          )}
          {custos.map((c) => (
            <tr key={c.id}>
              <td>
                {c.descricao || 'Despesa'}
                <span className="block text-[11px] text-muted">{formatarData(c.data)}</span>
              </td>
              <td className="text-right">{formatarReaisCurto(c.valorCentavos)}</td>
              <td className="w-8">
                <form action={removerCustoAcao}>
                  <input type="hidden" name="custoId" value={c.id} />
                  <input type="hidden" name="veiculoId" value={veiculoId} />
                  <button type="submit" aria-label="Remover lançamento" className="btn btn-ghost !px-1">
                    ×
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <LancarCusto veiculoId={veiculoId} acao={lancarCustoAcao} />
      </div>

      <p className="mt-3 text-[11px] text-muted">
        Todo lançamento entra no custo deste carro e reduz o lucro da venda.
      </p>

      <Link href={`/admin/veiculos/${veiculoId}`} className="btn btn-secondary btn-block">
        Abrir cadastro completo
      </Link>
      </aside>
    </>
  )
}
