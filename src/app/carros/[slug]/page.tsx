import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { Galeria } from '@/components/Galeria'
import { SimuladorFinanciamento } from '@/components/SimuladorFinanciamento'
import { BarraContatoMobile, mensagemInteresse } from '@/components/BarraContato'
import { urlFoto } from '@/lib/armazenamento'
import { SITE, linkWhatsapp } from '@/lib/config-site'
import { formatarKm, formatarReaisCurto } from '@/lib/dinheiro'
import { ROTULO_CAMBIO, ROTULO_CARROCERIA, ROTULO_COMBUSTIVEL, SELOS } from '@/lib/veiculos-tipos'
import { buscarAnuncio } from '@/lib/vitrine'
import type { Anuncio } from '@/lib/vitrine'

// `cache` do React: a página e o generateMetadata precisam do mesmo anúncio.
// Sem isto seriam duas consultas idênticas ao banco em toda visita.
const carregar = cache(async (slug: string) => buscarAnuncio(slug))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const anuncio = await carregar(slug)
  if (!anuncio) return { title: 'Anúncio não encontrado' }

  const titulo = `${anuncio.marca} ${anuncio.modelo}${anuncio.versao ? ` ${anuncio.versao}` : ''} ${anuncio.anoFabricacao}/${anuncio.anoModelo}`
  const descricao = `${formatarReaisCurto(anuncio.precoCentavos)} · ${formatarKm(anuncio.km)} · ${ROTULO_CAMBIO[anuncio.cambio]} · ${ROTULO_COMBUSTIVEL[anuncio.combustivel]}`
  const capa = urlFoto(anuncio.fotoCapa)

  // É este bloco que faz aparecer o cartão com foto e preço quando o Jair cola
  // o link num grupo de WhatsApp. Sem ele sai um retângulo cinza — e metade da
  // venda acontece nesse primeiro olhar.
  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: `${titulo} — ${formatarReaisCurto(anuncio.precoCentavos)}`,
      description: descricao,
      type: 'website',
      images: capa ? [{ url: capa, width: 1600, alt: titulo }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} — ${formatarReaisCurto(anuncio.precoCentavos)}`,
      description: descricao,
      images: capa ? [capa] : undefined,
    },
  }
}

export default async function PaginaAnuncio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const anuncio = await carregar(slug)

  // Carro vendido ou ainda em rascunho cai aqui: `buscarAnuncio` só devolve o
  // que está no ar.
  if (!anuncio) notFound()

  const tituloCompleto = `${anuncio.marca} ${anuncio.modelo}${anuncio.versao ? ` ${anuncio.versao}` : ''}`
  const selosMarcados = SELOS.filter((s) => anuncio.selos[paraChave(s.campo)])

  return (
    <>
      <Cabecalho ativo="/carros" />

      {/* pb-28 no celular abre espaço pra barra fixa de conversão não cobrir o
          fim do conteúdo. */}
      <main className="mx-auto max-w-[1180px] px-4 pt-6 pb-28 lg:pb-8">
        <Link href="/" className="btn btn-ghost">
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          Voltar ao estoque
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          {/* ── coluna esquerda: fotos e ficha ───────────────────────────── */}
          <div className="min-w-0">
            <Galeria
              fotos={anuncio.fotos.map((f) => ({
                grande: urlFoto(f.chave)!,
                miniatura: urlFoto(f.miniatura ?? f.chave)!,
              }))}
              titulo={tituloCompleto}
            />

            <h2 className="mt-8 !text-[20px]">Ficha do veículo</h2>
            <table className="table">
              <tbody>
                <Linha rotulo="Ano/modelo" valor={`${anuncio.anoFabricacao}/${anuncio.anoModelo}`} />
                <Linha rotulo="Quilometragem" valor={formatarKm(anuncio.km)} />
                <Linha rotulo="Câmbio" valor={ROTULO_CAMBIO[anuncio.cambio]} />
                <Linha rotulo="Combustível" valor={ROTULO_COMBUSTIVEL[anuncio.combustivel]} />
                {anuncio.carroceria && (
                  <Linha rotulo="Carroceria" valor={ROTULO_CARROCERIA[anuncio.carroceria]} />
                )}
                <Linha rotulo="Cor" valor={anuncio.cor} />
                <Linha rotulo="Portas" valor={String(anuncio.portas)} />
                {anuncio.finalPlaca && <Linha rotulo="Placa" valor={`final ${anuncio.finalPlaca}`} />}
                <Linha
                  rotulo="Laudo cautelar"
                  valor={anuncio.selos.laudoCautelarOk ? 'Aprovado' : 'Sob consulta'}
                />
                {/* O número de chaves não é um campo do cadastro: sai da chave
                    reserva, que é o que o Jair realmente marca. */}
                <Linha rotulo="Chaves" valor={anuncio.selos.chaveReserva ? '2' : '1'} />
              </tbody>
            </table>

            {anuncio.descricao && (
              <>
                <h2 className="mt-8 !text-[20px]">Sobre este carro</h2>
                <p className="whitespace-pre-line text-[14px]">{anuncio.descricao}</p>
              </>
            )}

            {anuncio.opcionais.length > 0 && (
              <>
                <h2 className="mt-8 !text-[20px]">Opcionais</h2>
                <div className="flex flex-wrap gap-2">
                  {anuncio.opcionais.map((o) => (
                    <span key={o} className="tag tag-neutral">
                      {o}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── coluna direita: título, preço e conversão ────────────────── */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px] lg:self-start">
            <div>
              <p className="kicker m-0">{anuncio.marca}</p>
              <h1 className="mt-1 !text-[32px] !font-medium">
                {anuncio.modelo}
                {anuncio.versao && <span className="font-normal"> {anuncio.versao}</span>}
              </h1>
              <p className="jj-num m-0 text-[13px] text-muted">
                {anuncio.anoFabricacao}/{anuncio.anoModelo} · {formatarKm(anuncio.km)} ·{' '}
                <span className="font-sans">{ROTULO_CAMBIO[anuncio.cambio]}</span>
              </p>

              {selosMarcados.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selosMarcados.map((s) => (
                    <span key={s.campo} className="tag tag-outline">
                      {s.rotulo}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <p className="m-0 text-[11px] text-muted">à vista</p>
              <p className="jj-num m-0 font-heading text-[40px] leading-none font-semibold tracking-[-0.03em]">
                {formatarReaisCurto(anuncio.precoCentavos)}
              </p>
              {anuncio.aceitaTroca && (
                <p className="m-0 text-[12px] text-muted">Aceita troca na negociação</p>
              )}

              {SITE.financiamento.ativo && (
                <>
                  <hr className="hr !my-2" />
                  <SimuladorFinanciamento
                    precoCentavos={anuncio.precoCentavos}
                    taxaMensal={SITE.financiamento.taxaMensal}
                    prazos={[...SITE.financiamento.prazos]}
                    ressalva={SITE.financiamento.ressalva}
                  />
                </>
              )}

              {/* No celular a conversão vive na barra fixa do rodapé. */}
              <a
                href={linkWhatsapp(mensagemInteresse(anuncio))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-zap btn-block hidden lg:inline-flex"
              >
                Falar no WhatsApp
              </a>
              <a
                href={linkWhatsapp(
                  `Olá! Gostaria de agendar um test-drive do ${tituloCompleto} ${anuncio.anoModelo}.\n${SITE.url}/carros/${anuncio.slug}`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-block hidden lg:inline-flex"
              >
                Agendar test-drive
              </a>
            </div>

            {SITE.incluidoNaCompra.length > 0 && (
              <div className="card">
                <h2 className="card-title m-0">Incluído na compra</h2>
                <ul className="m-0 list-none p-0 text-[13px]">
                  {SITE.incluidoNaCompra.map((item) => (
                    <li key={item} className="flex gap-2 py-1">
                      <span aria-hidden="true" className="text-accent">
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>

      <BarraContatoMobile anuncio={anuncio} />
      <Rodape />
    </>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <tr>
      <th scope="row" className="w-[40%] !normal-case !tracking-normal">
        {rotulo}
      </th>
      <td className="jj-num">{valor}</td>
    </tr>
  )
}

/** 'ipva_pago' → 'ipvaPago' */
function paraChave(campo: string): keyof Anuncio['selos'] {
  return campo.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase()) as keyof Anuncio['selos']
}
