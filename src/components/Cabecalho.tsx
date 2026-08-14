import Link from 'next/link'
import { SITE, linkWhatsapp } from '@/lib/config-site'

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b border-grafite-800 bg-grafite-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-lg font-black tracking-tight text-grafite-50 transition group-hover:text-ambar-400">
            {SITE.nome}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/carros"
            className="rounded-lg px-3 py-2 text-sm font-medium text-grafite-300 transition hover:bg-grafite-800 hover:text-grafite-50"
          >
            Estoque
          </Link>
          <a
            href={linkWhatsapp(`Olá ${SITE.nome.split(' ')[0]}, vim pelo site e queria falar com você.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-zap px-3.5 py-2 text-sm font-semibold text-grafite-950 transition hover:bg-zap-escuro hover:text-white"
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  )
}
