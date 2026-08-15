import Link from 'next/link'
import type { Metadata } from 'next'
import { SITE } from '@/lib/config-site'
import { FormularioLogin } from './FormularioLogin'

export const metadata: Metadata = {
  title: 'Entrar',
  // Tela de login não tem nada que interesse a buscador, e indexá-la só
  // convida robô a bater nela.
  robots: { index: false, follow: false },
}

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ voltar?: string }>
}) {
  const { voltar } = await searchParams

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-heading text-[20px] font-semibold tracking-[-0.012em] text-text no-underline"
          >
            {SITE.nome.replace(' Veículos', '')} <span className="text-accent">Veículos</span>
          </Link>
          <p className="kicker mt-2">Painel do vendedor</p>
        </div>

        <div className="card">
          <FormularioLogin voltar={voltar ?? '/admin'} />
        </div>

        <p className="mt-4 text-center text-[13px]">
          <Link href="/" className="text-muted no-underline hover:text-accent">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </main>
  )
}
