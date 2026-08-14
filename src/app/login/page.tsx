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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-grafite-900 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-grafite-50">
            {SITE.nome}
          </Link>
          <p className="mt-2 text-sm text-grafite-400">Painel do vendedor</p>
        </div>

        <div className="rounded-2xl border border-grafite-700 bg-grafite-800 p-6 shadow-2xl">
          <FormularioLogin voltar={voltar ?? '/admin'} />
        </div>

        <p className="mt-6 text-center text-sm text-grafite-500">
          <Link href="/" className="transition hover:text-grafite-300">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </main>
  )
}
