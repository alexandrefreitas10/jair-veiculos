import Link from 'next/link'
import { SITE, linkWhatsapp } from '@/lib/config-site'

export function Rodape() {
  const ano = new Date().getFullYear()

  return (
    <footer className="mt-8 border-t border-[var(--color-divider)]">
      <div className="mx-auto max-w-[1180px] px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-[36ch]">
            <p className="m-0 font-heading text-[18px] font-semibold tracking-[-0.012em]">
              {SITE.nome.replace(' Veículos', '')} <span className="text-accent">Veículos</span>
            </p>
            <p className="mt-2 text-[13px] text-muted">{SITE.descricao}</p>
            <p className="kicker mt-3">
              {SITE.cidade} · {SITE.estado}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-[14px]">
            <p className="kicker m-0">Contato</p>
            <a
              href={linkWhatsapp('Olá! Vim pelo site.')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text no-underline hover:text-accent"
            >
              WhatsApp
            </a>
            {/* Só aparecem quando preenchidos: item vazio no rodapé é pior que
                item ausente. */}
            {SITE.instagram && (
              <a
                href={`https://instagram.com/${SITE.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text no-underline hover:text-accent"
              >
                {SITE.instagram}
              </a>
            )}
            {SITE.telefone && (
              <a
                href={`tel:${SITE.telefone.replace(/\D/g, '')}`}
                className="text-text no-underline hover:text-accent"
              >
                {SITE.telefone}
              </a>
            )}
          </div>
        </div>

        <hr className="hr" />

        <div className="flex flex-col gap-2 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">
            © {ano} {SITE.nome}. Preços e disponibilidade sujeitos a alteração sem aviso.
          </p>
          <Link href="/login" className="text-muted no-underline hover:text-accent">
            Área do vendedor
          </Link>
        </div>
      </div>
    </footer>
  )
}
