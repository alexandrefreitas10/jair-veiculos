import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormularioVeiculo } from '@/components/admin/FormularioVeiculo'
import { EnviarFotos } from '@/components/admin/EnviarFotos'
import { urlFoto } from '@/lib/armazenamento'
import { formatarReais, formatarReaisCurto, somar } from '@/lib/dinheiro'
import { formatarData } from '@/lib/periodo'
import { buscarVeiculo } from '@/lib/veiculos'
import { listarFotos } from '@/lib/fotos'
import { listarCustos } from '@/lib/custos'
import { buscarNegocioDoVeiculo } from '@/lib/negocios'
import { ROTULO_ESTADO } from '@/lib/veiculos-tipos'
import {
  salvarVeiculoAcao, enviarFotosAcao, removerFotoAcao, definirCapaAcao,
  mudarEstadoAcao, apagarVeiculoAcao,
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
      <nav className="mb-3 text-[13px] text-muted">
        <Link href="/admin/veiculos" className="text-muted no-underline hover:text-accent">
          Estoque
        </Link>
        <span className="mx-2">/</span>
        <span>
          {veiculo.marca} {veiculo.modelo}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker m-0">{veiculo.marca}</p>
          <h1 className="titulo-pagina mt-1">
            {veiculo.modelo} <span className="jj-num font-normal text-muted">{veiculo.anoModelo}</span>
          </h1>
          <p className="m-0 text-[13px] text-muted">
            {ROTULO_ESTADO[veiculo.estado]} · entrou em {formatarData(veiculo.dataEntrada)}
          </p>
        </div>

        {(veiculo.estado === 'disponivel' || veiculo.estado === 'reservado') && (
          <Link href={`/carros/${veiculo.slug}`} target="_blank" className="btn btn-ghost">
            Ver anúncio no site ↗
          </Link>
        )}
      </div>

      {novo === '1' && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-accent-100)] px-3 py-2 text-[13px] text-accent-800">
          Cadastro criado. Agora adicione as fotos abaixo — depois é só publicar.
        </p>
      )}

      <section className="card mt-5 !flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <p className="m-0 text-[10px] tracking-[0.1em] text-muted uppercase">Situação</p>
          <p className="m-0 text-[15px]">{ROTULO_ESTADO[veiculo.estado]}</p>
        </div>

        {vendido ? (
          <p className="m-0 text-[13px] text-muted">
            Vendido em {formatarData(negocio?.data)} ·{' '}
            <Link href="/admin/negocios" className="text-accent-700">
              ver a venda
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {veiculo.estado !== 'disponivel' && (
              <BotaoEstado id={veiculo.id} estado="disponivel">
                {veiculo.estado === 'rascunho' ? 'Publicar no site' : 'Voltar pro site'}
              </BotaoEstado>
            )}
            {veiculo.estado === 'disponivel' && (
              <BotaoEstado id={veiculo.id} estado="reservado">Marcar como reservado</BotaoEstado>
            )}
            {veiculo.estado === 'reservado' && (
              <BotaoEstado id={veiculo.id} estado="disponivel">Voltar pra disponível</BotaoEstado>
            )}
            {veiculo.estado !== 'rascunho' && veiculo.estado !== 'arquivado' && (
              <BotaoEstado id={veiculo.id} estado="arquivado">Tirar do site</BotaoEstado>
            )}
            <Link href={`/admin/negocios/novo?veiculo=${veiculo.id}`} className="btn btn-primary">
              Registrar venda
            </Link>
          </div>
        )}
      </section>

      {veiculo.estado === 'rascunho' && fotos.length === 0 && (
        <p className="mt-3 text-[13px] text-muted">
          Sem foto, o anúncio aparece como um retângulo vazio na listagem. Vale adicionar antes de
          publicar.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 flex flex-col gap-4">
          <section className="card">
            <div className="flex items-baseline justify-between">
              <h2 className="card-title m-0">Fotos</h2>
              <span className="kicker">
                {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            {fotos.length > 0 && (
              <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
                {fotos.map((f) => (
                  <li key={f.id}>
                    <div
                      className="plate aspect-4/3 !border-4"
                      style={f.capa ? { outlineColor: 'var(--color-accent)', outlineWidth: '2px' } : undefined}
                    >
                      <img src={urlFoto(f.chaveMiniatura ?? f.chave)!} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      {f.capa ? (
                        <span className="text-[11px] text-accent-700">capa</span>
                      ) : (
                        <form action={definirCapaAcao}>
                          <input type="hidden" name="fotoId" value={f.id} />
                          <input type="hidden" name="veiculoId" value={veiculo.id} />
                          <button type="submit" className="btn btn-ghost !px-1 !text-[11px]">
                            usar como capa
                          </button>
                        </form>
                      )}
                      <form action={removerFotoAcao}>
                        <input type="hidden" name="fotoId" value={f.id} />
                        <input type="hidden" name="veiculoId" value={veiculo.id} />
                        <button type="submit" className="btn btn-ghost !px-1 !text-[11px] !text-red-800">
                          apagar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <EnviarFotos veiculoId={veiculo.id} acao={enviarFotosAcao} />
          </section>

          <FormularioVeiculo acao={salvarVeiculoAcao} veiculo={veiculo} rotuloBotao="Salvar alterações" />
        </div>

        <aside className="flex flex-col gap-4">
          <section className="card">
            <h2 className="card-title m-0">Quanto tem nele</h2>
            <dl className="m-0 mt-2 flex flex-col gap-2 text-[13px]">
              {veiculo.origem === 'proprio' ? (
                <Linha rotulo="Compra" valor={formatarReais(veiculo.valorCompraCentavos)} />
              ) : (
                <Linha rotulo="Origem" valor="Consignado" />
              )}
              <Linha rotulo="Despesas" valor={formatarReais(totalCustos)} />
              <hr className="hr !my-1" />
              <Linha rotulo="Investido" valor={formatarReais(investido)} forte />
              <Linha rotulo="Anunciado" valor={formatarReais(veiculo.precoCentavos)} />

              {veiculo.origem === 'proprio' && veiculo.precoCentavos > 0 && !vendido && (
                <>
                  <hr className="hr !my-1" />
                  <Linha
                    rotulo="Se vender pelo anunciado"
                    valor={formatarReais(veiculo.precoCentavos - investido)}
                    tom={veiculo.precoCentavos - investido >= 0 ? 'accent' : 'negativo'}
                  />
                </>
              )}

              {negocio && (
                <>
                  <hr className="hr !my-1" />
                  <Linha rotulo="Vendido por" valor={formatarReais(negocio.valorVendaCentavos)} />
                  <Linha
                    rotulo="Lucro"
                    valor={formatarReais(negocio.lucro)}
                    forte
                    tom={negocio.lucro >= 0 ? 'accent' : 'negativo'}
                  />
                </>
              )}
            </dl>

            <Link href={`/admin?veiculo=${veiculo.id}`} className="btn btn-secondary btn-block">
              Abrir o extrato no livro
            </Link>
          </section>

          <section className="card">
            <h2 className="card-title m-0">Lançamentos</h2>
            {custos.length === 0 ? (
              <p className="m-0 text-[13px] text-muted">
                Nenhuma despesa lançada. Use o livro para adicionar.
              </p>
            ) : (
              <ul className="m-0 list-none p-0 text-[13px]">
                {custos.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 border-b border-[var(--color-divider)] py-2">
                    <span className="min-w-0">
                      {c.descricao || 'Despesa'}
                      <span className="block text-[11px] text-muted">{formatarData(c.data)}</span>
                    </span>
                    <span className="jj-num">{formatarReaisCurto(c.valorCentavos)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!vendido && (
            <section className="card !border-red-800/30">
              <h2 className="card-title m-0 text-muted">Apagar</h2>
              <p className="m-0 text-[12px] text-muted">
                Some com o cadastro e as fotos, e não dá pra desfazer. Se o carro já foi vendido, use
                “tirar do site” — assim o histórico fica.
              </p>
              <form action={apagarVeiculoAcao}>
                <input type="hidden" name="id" value={veiculo.id} />
                <button type="submit" className="btn btn-secondary !border-red-800/40 !text-red-800">
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
  children,
}: {
  id: number
  estado: string
  children: React.ReactNode
}) {
  return (
    <form action={mudarEstadoAcao}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button type="submit" className="btn btn-secondary">
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
  tom?: 'accent' | 'negativo'
}) {
  const cor = tom === 'accent' ? 'text-accent-700' : tom === 'negativo' ? 'text-red-700' : ''
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{rotulo}</dt>
      <dd className={`jj-num m-0 ${forte ? 'font-semibold' : ''} ${cor}`}>{valor}</dd>
    </div>
  )
}
