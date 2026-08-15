import { SITE, linkWhatsapp } from '@/lib/config-site'
import { formatarReaisCurto } from '@/lib/dinheiro'
import type { Anuncio } from '@/lib/vitrine'

/**
 * A conversão do anúncio. No celular vira uma barra fixa no rodapé que
 * substitui a barra de navegação, conforme o handoff.
 *
 * Não há modal de captura de lead: o botão leva direto para o WhatsApp, com a
 * mensagem montada. O link do anúncio vai DENTRO da mensagem de propósito — o
 * Jair recebe várias conversas por dia, e "tenho interesse no carro" sem
 * referência obriga ele a perguntar de qual carro se trata, justamente no
 * momento mais quente da venda.
 */
export function mensagemInteresse(anuncio: Anuncio): string {
  const titulo = `${anuncio.marca} ${anuncio.modelo}${anuncio.versao ? ` ${anuncio.versao}` : ''} ${anuncio.anoModelo}`
  return (
    `Olá! Tenho interesse no ${titulo} — ${formatarReaisCurto(anuncio.precoCentavos)}.\n` +
    `${SITE.url}/carros/${anuncio.slug}`
  )
}

export function BarraContatoMobile({ anuncio }: { anuncio: Anuncio }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-divider)] bg-bg/95 px-[18px] py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[11px] text-muted">à vista</p>
          <p className="jj-num m-0 font-heading text-[23px] leading-none font-semibold tracking-[-0.02em]">
            {formatarReaisCurto(anuncio.precoCentavos)}
          </p>
        </div>
        <a
          href={linkWhatsapp(mensagemInteresse(anuncio))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-zap min-h-[48px] flex-1"
        >
          Falar no WhatsApp
        </a>
      </div>
    </div>
  )
}
