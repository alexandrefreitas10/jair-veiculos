import Link from 'next/link'
import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { CardCarro } from '@/components/CardCarro'
import { SITE } from '@/lib/config-site'
import { listarDestaques, listarVitrine, totalNaVitrine } from '@/lib/vitrine'

// Renderiza a cada requisição, sempre.
//
// Sem esta linha o Next pré-renderiza a home no build — ela não usa cookie,
// cabeçalho nem parâmetro de URL, então ele conclui que é estática. O resultado
// seria o estoque congelado no dia do deploy: o Jair publica um carro, atualiza
// a página e não vê nada mudar, e um carro vendido continua anunciado até o
// próximo deploy. O build indica isso na tabela de rotas com "○ Static", que é
// fácil de ler como sinal de sucesso quando na verdade é o aviso.
export const dynamic = 'force-dynamic'

const FAIXAS = [
  { rotulo: 'Até R$ 40 mil', parametro: 'precoMax=4000000' },
  { rotulo: 'R$ 40 a 70 mil', parametro: 'precoMin=4000000&precoMax=7000000' },
  { rotulo: 'Acima de R$ 70 mil', parametro: 'precoMin=7000000' },
  { rotulo: 'Automáticos', parametro: 'cambio=automatico' },
]

export default async function Home() {
  const [destaques, todos, total] = await Promise.all([
    listarDestaques(6),
    listarVitrine({ limite: 12 }),
    totalNaVitrine(),
  ])

  // Tira da segunda seção o que já apareceu nos destaques. Com estoque de dez
  // carros, sem isto quase todo cartão aparece duas vezes na mesma rolagem — e
  // a página passa a impressão de ter menos variedade do que tem.
  const idsEmDestaque = new Set(destaques.map((d) => d.id))
  const recentes = todos.filter((c) => !idsEmDestaque.has(c.id))

  return (
    <>
      <Cabecalho />

      <main className="relative">
        <section className="brilho-ambar border-b border-grafite-800">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
            <p className="etiqueta">
              {SITE.cidade} · {SITE.estado}
            </p>

            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight text-grafite-50 sm:text-6xl">
              Carro usado escolhido
              <br />
              <span className="text-ambar-400">um por um.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-grafite-300">
              Procedência conferida, documentação em dia e conversa direta comigo — sem vendedor de
              plantão, sem enrolação.
            </p>

            <form action="/carros" className="mt-8 flex max-w-lg gap-2">
              <input
                type="search"
                name="busca"
                placeholder="Marca ou modelo…"
                aria-label="Buscar por marca ou modelo"
                className="min-w-0 flex-1 rounded-xl border border-grafite-700 bg-grafite-900/80 px-4 py-3.5 text-grafite-100 placeholder:text-grafite-500 outline-none backdrop-blur transition focus:border-ambar-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-ambar-500 px-6 py-3.5 font-semibold text-grafite-950 transition hover:bg-ambar-400"
              >
                Buscar
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {FAIXAS.map((f) => (
                <Link
                  key={f.rotulo}
                  href={`/carros?${f.parametro}`}
                  className="rounded-full border border-grafite-700 px-4 py-2 text-sm text-grafite-300 transition hover:border-ambar-500/60 hover:text-ambar-300"
                >
                  {f.rotulo}
                </Link>
              ))}
            </div>

            {total > 0 && (
              <p className="numero mt-8 text-sm text-grafite-500">
                {total} {total === 1 ? 'carro disponível' : 'carros disponíveis'} agora
              </p>
            )}
          </div>
        </section>

        {destaques.length > 0 && (
          <Secao titulo="Destaques" descricao="O que eu recomendo olhar primeiro.">
            <Grade carros={destaques} />
          </Secao>
        )}

        {/* Só aparece se sobrou algo além dos destaques. */}
        {recentes.length > 0 && (
          <Secao
            titulo={destaques.length > 0 ? 'Também no estoque' : 'Estoque'}
            descricao={destaques.length > 0 ? undefined : 'Todos os carros disponíveis no momento.'}
            verTudo={total > destaques.length + recentes.length}
          >
            <Grade carros={recentes} />
          </Secao>
        )}

        {total === 0 && (
          <section className="mx-auto max-w-6xl px-5 py-14">
            <div className="rounded-xl border border-dashed border-grafite-700 px-6 py-16 text-center">
              <p className="text-grafite-300">Nenhum carro publicado ainda.</p>
              <p className="mt-1 text-sm text-grafite-500">Volte em breve — o estoque gira rápido.</p>
            </div>
          </section>
        )}
      </main>

      <Rodape />
    </>
  )
}

function Secao({
  titulo,
  descricao,
  verTudo,
  children,
}: {
  titulo: string
  descricao?: string
  verTudo?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-grafite-50">{titulo}</h2>
          {descricao && <p className="mt-1 text-sm text-grafite-400">{descricao}</p>}
        </div>
        {verTudo && (
          <Link
            href="/carros"
            className="shrink-0 text-sm font-medium text-ambar-400 transition hover:text-ambar-300"
          >
            Ver todos →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Grade({ carros }: { carros: Awaited<ReturnType<typeof listarVitrine>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {carros.map((c, i) => (
        <CardCarro key={c.id} carro={c} indice={i} />
      ))}
    </div>
  )
}
