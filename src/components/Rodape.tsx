import Link from 'next/link'
import { SITE, linkWhatsapp } from '@/lib/config-site'

export function Rodape() {
  const ano = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-grafite-800 bg-grafite-950">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <p className="font-display text-lg font-black tracking-tight text-grafite-50">{SITE.nome}</p>
            <p className="mt-2 text-sm leading-relaxed text-grafite-400">{SITE.descricao}</p>
            <p className="etiqueta mt-4">
              {SITE.cidade} · {SITE.estado}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <p className="etiqueta mb-1">Contato</p>
            <a
              href={linkWhatsapp('Olá! Vim pelo site.')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-grafite-300 transition hover:text-ambar-400"
            >
              WhatsApp
            </a>
            {/* Instagram e telefone só aparecem quando o Jair informar — item
                vazio no rodapé é pior do que item ausente. */}
            {SITE.instagram && (
              <a
                href={`https://instagram.com/${SITE.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-grafite-300 transition hover:text-ambar-400"
              >
                {SITE.instagram}
              </a>
            )}
            {SITE.telefone && (
              <a href={`tel:${SITE.telefone.replace(/\D/g, '')}`} className="text-grafite-300 transition hover:text-ambar-400">
                {SITE.telefone}
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-grafite-800 pt-6 text-xs text-grafite-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {ano} {SITE.nome}. Preços e disponibilidade sujeitos a alteração sem aviso.
          </p>
          <Link href="/login" className="transition hover:text-grafite-300">
            Área do vendedor
          </Link>
        </div>
      </div>
    </footer>
  )
}
