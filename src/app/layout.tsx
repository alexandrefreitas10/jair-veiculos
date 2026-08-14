import type { Metadata } from 'next'
import './globals.css'
import { SITE } from '@/lib/config-site'

export const metadata: Metadata = {
  title: { default: `${SITE.nome} — Carros usados e seminovos`, template: `%s | ${SITE.nome}` },
  description: SITE.descricao,
  metadataBase: new URL(SITE.url),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
