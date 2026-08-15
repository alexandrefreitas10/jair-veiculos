import Link from 'next/link'
import { SITE } from '@/lib/config-site'

// Nav do handoff: marca à esquerda, itens à direita, hairline embaixo, sticky.
// O item ativo leva `aria-current="page"` — é o que o leitor de tela anuncia e
// também o que pinta o dourado, então a marcação visual e a semântica não têm
// como divergir.

const ITENS = [
  { href: '/carros', rotulo: 'Estoque' },
  { href: '/financiamento', rotulo: 'Financiamento' },
  { href: '/vender', rotulo: 'Vender meu carro' },
  { href: '/contato', rotulo: 'Contato' },
]

export function Cabecalho({ ativo }: { ativo?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="mr-auto font-heading text-[18px] font-semibold tracking-[-0.012em] text-text no-underline"
        >
          {SITE.nome.replace(' Veículos', '')} <span className="text-accent">Veículos</span>
        </Link>

        <nav className="flex items-center gap-4">
          {ITENS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={ativo === i.href ? 'page' : undefined}
              className="hidden text-[14px] text-text no-underline hover:text-accent aria-[current=page]:text-accent sm:inline"
            >
              {i.rotulo}
            </Link>
          ))}
          {/* No celular a nav inteira não cabe; sobra o essencial. */}
          <Link
            href="/carros"
            aria-current={ativo === '/carros' ? 'page' : undefined}
            className="text-[14px] text-text no-underline hover:text-accent aria-[current=page]:text-accent sm:hidden"
          >
            Estoque
          </Link>
        </nav>
      </div>
    </header>
  )
}
