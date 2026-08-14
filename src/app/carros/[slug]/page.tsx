import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { Galeria } from '@/components/Galeria'
import { Selos } from '@/components/Selos'
import { BarraContato } from '@/components/BarraContato'
import { urlFoto } from '@/lib/armazenamento'
import { formatarKm, formatarReaisCurto } from '@/lib/dinheiro'
import { ROTULO_CAMBIO, ROTULO_CARROCERIA, ROTULO_COMBUSTIVEL } from '@/lib/veiculos-tipos'
import { buscarAnuncio } from '@/lib/vitrine'

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
  // o link num grupo de WhatsApp ou no Instagram. Sem ele, sai um retângulo
  // cinza — e metade da venda acontece nesse primeiro olhar.
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
  // que está no ar. É o comportamento certo — anúncio de carro que já foi
  // vendido gera contato que o Jair não pode atender.
  if (!anuncio) notFound()

  const titulo = `${anuncio.marca} ${anuncio.modelo}`
  const tituloCompleto = `${titulo}${anuncio.versao ? ` ${anuncio.versao}` : ''}`

  const ficha = [
    { rotulo: 'Ano', valor: `${anuncio.anoFabricacao}/${anuncio.anoModelo}`, mono: true },
    { rotulo: 'Quilometragem', valor: formatarKm(anuncio.km), mono: true },
    { rotulo: 'Câmbio', valor: ROTULO_CAMBIO[anuncio.cambio] },
    { rotulo: 'Combustível', valor: ROTULO_COMBUSTIVEL[anuncio.combustivel] },
    { rotulo: 'Cor', valor: anuncio.cor },
    { rotulo: 'Portas', valor: String(anuncio.portas), mono: true },
    ...(anuncio.carroceria ? [{ rotulo: 'Carroceria', valor: ROTULO_CARROCERIA[anuncio.carroceria] }] : []),
    ...(anuncio.finalPlaca ? [{ rotulo: 'Final da placa', valor: anuncio.finalPlaca, mono: true }] : []),
  ]

  return (
    <>
      <Cabecalho />

      {/* pb-28 no celular abre espaço pra barra fixa de WhatsApp não cobrir o
          fim do texto. */}
      <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 lg:pb-16">
        <nav aria-label="Trilha" className="mb-5 text-sm text-grafite-500">
          <Link href="/" className="transition hover:text-grafite-300">
            Início
          </Link>
          <span className="mx-2 text-grafite-700">/</span>
          <Link href="/carros" className="transition hover:text-grafite-300">
            Estoque
          </Link>
          <span className="mx-2 text-grafite-700">/</span>
          <span className="text-grafite-300">{titulo}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0">
            <header className="mb-5">
              <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-grafite-50 sm:text-4xl">
                {titulo}
              </h1>
              {anuncio.versao && <p className="mt-1 text-lg text-grafite-400">{anuncio.versao}</p>}

              {/* No celular o preço precisa aparecer aqui também: a barra fixa
                  fica no rodapé e o cliente rola as fotos antes de vê-la. */}
              <p className="numero mt-3 text-2xl font-semibold text-ambar-400 lg:hidden">
                {formatarReaisCurto(anuncio.precoCentavos)}
              </p>
            </header>

            {/* O servidor resolve as URLs; a galeria recebe texto pronto. */}
            <Galeria
              fotos={anuncio.fotos.map((f) => ({
                grande: urlFoto(f.chave)!,
                miniatura: urlFoto(f.miniatura ?? f.chave)!,
              }))}
              titulo={tituloCompleto}
            />

            <section className="mt-10" aria-labelledby="titulo-ficha">
              <h2 id="titulo-ficha" className="etiqueta mb-3">
                Ficha técnica
              </h2>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-grafite-800 bg-grafite-800 sm:grid-cols-3">
                {ficha.map((item) => (
                  <div key={item.rotulo} className="bg-grafite-900 px-4 py-3.5">
                    <dt className="etiqueta">{item.rotulo}</dt>
                    <dd className={`mt-1 text-grafite-100 ${item.mono ? 'numero' : ''}`}>{item.valor}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="mt-10">
              <Selos selos={anuncio.selos} />
            </div>

            {anuncio.opcionais.length > 0 && (
              <section className="mt-10" aria-labelledby="titulo-opcionais">
                <h2 id="titulo-opcionais" className="etiqueta mb-3">
                  Opcionais
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {anuncio.opcionais.map((o) => (
                    <li
                      key={o}
                      className="rounded-lg border border-grafite-700 bg-grafite-900 px-3 py-1.5 text-sm text-grafite-300"
                    >
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {anuncio.descricao && (
              <section className="mt-10" aria-labelledby="titulo-descricao">
                <h2 id="titulo-descricao" className="etiqueta mb-3">
                  Sobre este carro
                </h2>
                <div className="whitespace-pre-line leading-relaxed text-grafite-300">
                  {anuncio.descricao}
                </div>
              </section>
            )}
          </div>

          <aside>
            <BarraContato anuncio={anuncio} />
          </aside>
        </div>
      </main>

      <Rodape />
    </>
  )
}
