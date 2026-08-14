import type { Metadata, Viewport } from 'next'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { SITE } from '@/lib/config-site'

// Archivo: grotesca industrial, com peso Black para a marca. Escolhida no lugar
// das suspeitas de sempre porque tem cara de placa e de ficha técnica.
const fonteTitulo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--fonte-titulo',
  display: 'swap',
})

// Monoespaçada só para número: preço, km, ano, valores do financeiro. Numa
// coluna de valores, dígito de largura variável faz a vírgula dançar.
const fonteNumero = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fonte-numero',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${SITE.nome} — Carros usados e seminovos selecionados`,
    template: `%s | ${SITE.nome}`,
  },
  description: SITE.descricao,
  metadataBase: new URL(SITE.url),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE.nome,
  },
}

export const viewport: Viewport = {
  themeColor: '#121319',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteNumero.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
