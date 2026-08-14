import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormularioVeiculo } from '@/components/admin/FormularioVeiculo'
import { EnviarFotos } from '@/components/admin/EnviarFotos'
import { LancarCusto } from '@/components/admin/LancarCusto'
import { urlFoto } from '@/lib/armazenamento'
import { formatarReais, formatarReaisCurto, somar } from '@/lib/dinheiro'
import { formatarData } from '@/lib/periodo'
import { buscarVeiculo } from '@/lib/veiculos'
import { listarFotos } from '@/lib/fotos'
import { listarCustos } from '@/lib/custos'
import { buscarNegocioDoVeiculo } from '@/lib/negocios'
import { ROTULO_CATEGORIA_CUSTO, ROTULO_ESTADO } from '@/lib/veiculos-tipos'
import {
  salvarVeiculoAcao, enviarFotosAcao, removerFotoAcao, definirCapaAcao,
  lancarCustoAcao, removerCustoAcao, mudarEstadoAcao, apagarVeiculoAcao,
} from '../acoes'

export const metadata = { title: 'Editar veículo' }

export default async function EditarVeiculo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ novo?: string }>
}) {
  const { id } = await params
  const { novo } = await searchParams
  const veiculoId = Number(id)
  if (!Number.isInteger(veiculoId)) notFound()

  const veiculo = await buscarVeiculo(veiculoId)
  if (!veiculo) notFound()

  const [fotos, custos, negocio] = await Promise.all([
    listarFotos(veiculoId),
    listarCustos(veiculoId),
    buscarNegocioDoVeiculo(veiculoId),
  ])

  const totalCustos = somar(custos.map((c) => c.valorCentavos))
  const investido = (veiculo.valorCompraCentavos ?? 0) + totalCustos
  const vendido = veiculo.estado === 'vendido'

  return (
    <>
      <nav className="mb-4 text-sm text-grafite-500">
        <Link href="/admin/veiculos" className="transition hover:text-grafite-300">
          Veículos
        </Link>
        <span className="mx-2 text-grafite-700">/</span>
        <span className="text-grafite-300">
          {veiculo.marca} {veiculo.modelo}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-grafite-50">
            {veiculo.marca} {veiculo.modelo}{' '}
            <span className="numero font-normal text-grafite-500">{veiculo.anoModelo}</span>
          </h1>
          <p className="mt-1 text-sm text-grafite-400">
            {ROTULO_ESTADO[veiculo.estado]} · entrou em {formatarData(veiculo.dataEntrada)}
          </p>
        </div>

        {veiculo.estado === 'disponivel' || veiculo.estado === 'reservado' ? (
          <Link
            href={`/carros/${veiculo.slug}`}
            target="_blank"
            className="text-sm text-ambar-400 transition hover:text-ambar-300"
          >
            Ver anúncio no site ↗
          </Link>
        ) : null}
      </div>

      {novo === '1' && (
        <p className="mt-5 rounded-lg border border-ambar-500/30 bg-ambar-500/8 px-4 py-3 text-sm text-ambar-200">
          Cadastro criado. Agora adicione as fotos abaixo — depois é só publicar.
        </p>
      )}

      {/* ── Situação e ações ─────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-grafite-800 bg-grafite-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="etiqueta">Situação</p>
            <p className="mt-1 font-medium text-grafite-100">{ROTULO_ESTADO[veiculo.estado]}</p>
          </div>

          {vendido ? (
            <div className="text-sm text-grafite-400">
              Vendido em {formatarData(negocio?.data)} ·{' '}
              <Link href="/admin/negocios" className="text-ambar-400 transition hover:text-ambar-300">
                ver a venda
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {veiculo.estado !== 'disponivel' && (
                <BotaoEstado id={veiculo.id} estado="disponivel" destaque={fotos.length > 0}>
                  {veiculo.estado === 'rascunho' ? 'Publicar no site' : 'Voltar pro site'}
                </BotaoEstado>
              )}
              {veiculo.estado === 'disponivel' && (
                <BotaoEstado id={veiculo.id} estado="reservado">
                  Marcar como reservado
                </BotaoEstado>
              )}
              {veiculo.estado === 'reservado' && (
                <BotaoEstado id={veiculo.id} estado="disponivel">
                  Voltar pra disponível
                </BotaoEstado>
              )}
              {veiculo.estado !== 'rascunho' && veiculo.estado !== 'arquivado' && (
                <BotaoEstado id={veiculo.id} estado="arquivado">
                  Tirar do site
                </BotaoEstado>
              )}
              <Link
                href={`/admin/negocios/novo?veiculo=${veiculo.id}`}
                className="rounded-lg bg-conferido/15 px-4 py-2 text-sm font-medium text-conferido transition hover:bg-conferido/25"
              >
                Registrar venda
              </Link>
            </div>
          )}
        </div>

        {veiculo.estado === 'rascunho' && fotos.length === 0 && (
          <p className="mt-4 border-t border-grafite-800 pt-4 text-sm text-grafite-500">
            Sem foto, o anúncio aparece como um retângulo cinza na listagem. Vale adicionar antes de
            publicar.
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          {/* ── Fotos ────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-grafite-800 bg-grafite-900 p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display font-semibold text-grafite-50">Fotos</h2>
              <span className="etiqueta">
                {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            {fotos.length > 0 && (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fotos.map((f) => (
                  <li
                    key={f.id}
                    className={`group relative overflow-hidden rounded-lg border ${
                      f.capa ? 'border-ambar-500' : 'border-grafite-700'
                    }`}
                  >
                    <div className="aspect-4/3 bg-grafite-800">
                      <img
                        src={urlFoto(f.chaveMiniatura ?? f.chave)!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {f.capa && (
                      <span className="absolute left-2 top-2 rounded bg-ambar-500 px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-grafite-950">
                        Capa
                      </span>
                    )}

                    <div className="flex items-center justify-between gap-1 border-t border-grafite-800 bg-grafite-950 px-2 py-1.5">
                      {!f.capa ? (
                        <form action={definirCapaAcao}>
                          <input type="hidden" name="fotoId" value={f.id} />
                          <input type="hidden" name="veiculoId" value={veiculo.id} />
                          <button type="submit" className="text-xs text-grafite-400 transition hover:text-ambar-400">
                            Usar como capa
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-grafite-600">principal</span>
                      )}

                      <form action={removerFotoAcao}>
                        <input type="hidden" name="fotoId" value={f.id} />
                        <input type="hidden" name="veiculoId" value={veiculo.id} />
                        <button type="submit" className="text-xs text-grafite-500 transition hover:text-red-400">
                          Apagar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <EnviarFotos veiculoId={veiculo.id} acao={enviarFotosAcao} />
          </section>

          {/* ── Cadastro ─────────────────────────────────────────────────── */}
          <FormularioVeiculo acao={salvarVeiculoAcao} veiculo={veiculo} rotuloBotao="Salvar alterações" />
        </div>

        {/* ── Coluna do dinheiro ────────────────────────────────────────── */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-grafite-800 bg-grafite-900 p-5">
            <h2 className="font-display font-semibold text-grafite-50">Quanto tem nele</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              {veiculo.origem === 'proprio' ? (
                <Linha rotulo="Compra" valor={formatarReais(veiculo.valorCompraCentavos)} />
              ) : (
                <Linha rotulo="Origem" valor="Consignado" />
              )}
              <Linha rotulo="Custos" valor={formatarReais(totalCustos)} />
              <div className="border-t border-grafite-800 pt-2.5">
                <Linha rotulo="Investido" valor={formatarReais(investido)} forte />
              </div>
              <Linha rotulo="Anunciado" valor={formatarReais(veiculo.precoCentavos)} />

              {veiculo.origem === 'proprio' && veiculo.precoCentavos > 0 && !vendido && (
                <div className="border-t border-grafite-800 pt-2.5">
                  <Linha
                    rotulo="Se vender pelo anunciado"
                    valor={formatarReais(veiculo.precoCentavos - investido)}
                    tom={veiculo.precoCentavos - investido >= 0 ? 'positivo' : 'negativo'}
                  />
                </div>
              )}

              {negocio && (
                <div className="border-t border-grafite-800 pt-2.5">
                  <Linha rotulo="Vendido por" valor={formatarReais(negocio.valorVendaCentavos)} />
                  <Linha
                    rotulo="Lucro"
                    valor={formatarReais(negocio.lucro)}
                    forte
                    tom={negocio.lucro >= 0 ? 'positivo' : 'negativo'}
                  />
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-grafite-800 bg-grafite-900 p-5">
            <h2 className="font-display font-semibold text-grafite-50">Custos</h2>
            <p className="mt-1 text-sm text-grafite-400">
              Funilaria, mecânica, documentação — tudo que você põe no carro depois de pegar.
            </p>

            <div className="mt-4">
              <LancarCusto veiculoId={veiculo.id} acao={lancarCustoAcao} />
            </div>

            {custos.length > 0 && (
              <ul className="mt-4 divide-y divide-grafite-800 border-t border-grafite-800">
                {custos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="text-grafite-200">{ROTULO_CATEGORIA_CUSTO[c.categoria]}</p>
                      <p className="truncate text-xs text-grafite-500">
                        {formatarData(c.data)}
                        {c.descricao && ` · ${c.descricao}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="numero text-grafite-200">{formatarReaisCurto(c.valorCentavos)}</span>
                      <form action={removerCustoAcao}>
                        <input type="hidden" name="custoId" value={c.id} />
                        <input type="hidden" name="veiculoId" value={veiculo.id} />
                        <button
                          type="submit"
                          aria-label="Apagar custo"
                          className="text-grafite-600 transition hover:text-red-400"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!vendido && (
            <section className="rounded-xl border border-red-500/20 p-5">
              <h2 className="font-display font-semibold text-grafite-300">Apagar</h2>
              <p className="mt-1 text-sm text-grafite-500">
                Some com o cadastro e as fotos. Não dá pra desfazer — se o carro já foi vendido, use
                “tirar do site” em vez disso, pra não perder o histórico.
              </p>
              <form action={apagarVeiculoAcao} className="mt-3">
                <input type="hidden" name="id" value={veiculo.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                >
                  Apagar este veículo
                </button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}

function BotaoEstado({
  id,
  estado,
  destaque,
  children,
}: {
  id: number
  estado: string
  destaque?: boolean
  children: React.ReactNode
}) {
  return (
    <form action={mudarEstadoAcao}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button
        type="submit"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          destaque
            ? 'bg-ambar-500 text-grafite-950 hover:bg-ambar-400'
            : 'border border-grafite-700 text-grafite-200 hover:border-grafite-600'
        }`}
      >
        {children}
      </button>
    </form>
  )
}

function Linha({
  rotulo,
  valor,
  forte,
  tom,
}: {
  rotulo: string
  valor: string
  forte?: boolean
  tom?: 'positivo' | 'negativo'
}) {
  const cor = tom === 'positivo' ? 'text-conferido' : tom === 'negativo' ? 'text-red-400' : 'text-grafite-100'
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-grafite-400">{rotulo}</dt>
      <dd className={`numero ${forte ? 'font-semibold' : ''} ${cor}`}>{valor}</dd>
    </div>
  )
}
