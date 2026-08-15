import Link from 'next/link'
import type { Metadata } from 'next'
import { signOut } from '@/auth'
import { exigirSessao } from '@/lib/sessao'
import { SITE } from '@/lib/config-site'

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s | Painel' },
  robots: { index: false, follow: false },
}

// O painel nunca é estático: cada tela depende do estoque e das vendas de agora.
export const dynamic = 'force-dynamic'

// Nav interna do handoff.
const LINKS = [
  { href: '/admin/veiculos', rotulo: 'Estoque' },
  { href: '/admin', rotulo: 'Financeiro' },
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
      <header className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-4 py-3">
          <Link
            href="/admin"
            className="font-heading text-[18px] font-semibold tracking-[-0.012em] text-text no-underline"
          >
            {SITE.nome.replace(' Veículos', '')} <span className="text-accent">Veículos</span>
          </Link>

          {/* Rolagem horizontal no celular: quatro abas não cabem em 360px sem
              espremer o alvo de toque. */}
          <nav className="chips flex-1 items-center gap-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[14px] whitespace-nowrap text-text no-underline hover:text-accent"
              >
                {l.rotulo}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden text-[13px] text-muted no-underline hover:text-accent sm:inline"
            >
              Ver o site ↗
            </Link>
            <span className="hidden text-[13px] text-muted md:inline">{usuario.nome}</span>
            <form action={sair}>
              <button type="submit" className="btn btn-secondary">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-8">{children}</main>
    </div>
  )
}
