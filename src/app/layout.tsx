import type { Metadata, Viewport } from 'next'
import { Instrument_Sans } from 'next/font/google'
import './globals.css'
import { SITE } from '@/lib/config-site'

// Família única em todo o sistema, conforme o handoff. O design original do
// Classical usava serifada; a tipografia foi sobrescrita para uma grotesca
// neutra, e os pesos e o entreletras dos títulos vêm ajustados no globals.css.
const fonte = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--fonte',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${SITE.nome} — Carros revisados, procedência conferida`,
    template: `%s | ${SITE.nome}`,
  },
  description: SITE.descricao,
  metadataBase: new URL(SITE.url),
  openGraph: { type: 'website', locale: 'pt_BR', siteName: SITE.nome },
}

export const viewport: Viewport = {
  themeColor: '#f3f2f2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
