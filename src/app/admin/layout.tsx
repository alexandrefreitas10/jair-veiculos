import Link from 'next/link'
import type { Metadata } from 'next'
import { signOut } from '@/auth'
import { exigirSessao } from '@/lib/sessao'
import { SITE } from '@/lib/config-site'

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s | Painel' },
  robots: { index: false, follow: false },
}

// O painel nunca é estático: cada tela depende do estoque e das vendas de
// agora. Sem isto, o Next pré-renderizaria as telas sem dado de sessão.
export const dynamic = 'force-dynamic'

const LINKS = [
  { href: '/admin', rotulo: 'Painel' },
  { href: '/admin/veiculos', rotulo: 'Veículos' },
  { href: '/admin/negocios', rotulo: 'Vendas' },
  { href: '/admin/relatorios', rotulo: 'Relatórios' },
]

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  // Segunda camada. O proxy já redireciona quem não tem sessão, mas confiar só
  // nele deixaria o conteúdo a uma falha de configuração de distância.
  const usuario = await exigirSessao()

  async function sair() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-grafite-800 bg-grafite-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <Link href="/admin" className="font-display font-black tracking-tight text-grafite-50">
                {SITE.nome}
              </Link>
              <span className="etiqueta hidden sm:inline">painel</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                target="_blank"
                className="hidden text-sm text-grafite-400 transition hover:text-ambar-400 sm:inline"
              >
                Ver o site ↗
              </Link>
              <span className="hidden text-sm text-grafite-500 md:inline">{usuario.nome}</span>
              <form action={sair}>
                <button
                  type="submit"
                  className="rounded-lg border border-grafite-700 px-3 py-1.5 text-sm text-grafite-300 transition hover:border-grafite-600 hover:text-grafite-100"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>

          {/* Rolagem horizontal no celular: quatro abas não cabem em tela de
              360px sem espremer o toque. */}
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-grafite-400 transition hover:border-grafite-600 hover:text-grafite-100"
              >
                {l.rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  )
}
