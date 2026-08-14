import { SITE, linkWhatsapp } from '@/lib/config-site'
import { formatarReaisCurto } from '@/lib/dinheiro'
import type { Anuncio } from '@/lib/vitrine'

/**
 * A barra de contato do anúncio. No celular fica FIXA no rodapé.
 *
 * O link do anúncio vai dentro da mensagem de propósito. O Jair recebe várias
 * conversas por dia; "tenho interesse no carro" sem referência obriga ele a
 * perguntar de qual carro se trata, e esse vaivém acontece justamente no
 * momento mais quente da venda.
 */
export function BarraContato({ anuncio }: { anuncio: Anuncio }) {
  const titulo = `${anuncio.marca} ${anuncio.modelo}${anuncio.versao ? ` ${anuncio.versao}` : ''} ${anuncio.anoModelo}`
  const mensagem =
    `Olá! Tenho interesse no ${titulo} — ${formatarReaisCurto(anuncio.precoCentavos)}.\n` +
    `${SITE.url}/carros/${anuncio.slug}`

  return (
    <>
      {/* Celular: fixa no rodapé, sempre à mão enquanto ele rola as fotos. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-grafite-800 bg-grafite-950/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="etiqueta">Preço</p>
            <p className="numero truncate text-lg font-semibold text-ambar-400">
              {formatarReaisCurto(anuncio.precoCentavos)}
            </p>
          </div>
          <a
            href={linkWhatsapp(mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-zap px-5 py-3 font-semibold text-grafite-950 transition active:scale-95"
          >
            <IconeZap />
            Falar agora
          </a>
        </div>
      </div>

      {/* Computador: cartão que acompanha a rolagem, ao lado das fotos. */}
      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-grafite-800 bg-grafite-900 p-6">
          <p className="etiqueta">Preço</p>
          <p className="numero mt-1 text-3xl font-semibold text-ambar-400">
            {formatarReaisCurto(anuncio.precoCentavos)}
          </p>

          {anuncio.aceitaTroca && (
            <p className="mt-2 text-sm text-grafite-400">Aceita troca na negociação</p>
          )}

          <a
            href={linkWhatsapp(mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-zap px-5 py-3.5 font-semibold text-grafite-950 transition hover:bg-zap-escuro hover:text-white"
          >
            <IconeZap />
            Falar no WhatsApp
          </a>

          <p className="mt-4 text-center text-xs leading-relaxed text-grafite-500">
            Você fala direto com {SITE.nome.split(' ')[0]}, sem intermediário.
          </p>
        </div>
      </div>
    </>
  )
}

function IconeZap() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.25.69-1.44 1.32-1.99 1.4-.51.08-1.15.11-1.86-.12-.43-.13-.98-.32-1.69-.62-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.06.92 2.21.08.15.13.32.02.52-.1.2-.15.32-.3.5l-.45.52c-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.01.96.3.15.5.22.57.35.07.12.07.72-.18 1.41Z" />
    </svg>
  )
}
