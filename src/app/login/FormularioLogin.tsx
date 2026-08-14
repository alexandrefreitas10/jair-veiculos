'use client'

import { useActionState } from 'react'
import { entrar, type EstadoLogin } from './acoes'

const INICIAL: EstadoLogin = { erro: null }

export function FormularioLogin({ voltar }: { voltar: string }) {
  const [estado, acao, enviando] = useActionState(entrar, INICIAL)

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="voltar" value={voltar} />

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-grafite-200">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="w-full rounded-lg border border-grafite-600 bg-grafite-900 px-3.5 py-3 text-grafite-50 outline-none transition focus:border-ambar-500 focus:ring-2 focus:ring-ambar-500/30"
        />
      </div>

      <div>
        <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-grafite-200">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-grafite-600 bg-grafite-900 px-3.5 py-3 text-grafite-50 outline-none transition focus:border-ambar-500 focus:ring-2 focus:ring-ambar-500/30"
        />
      </div>

      {estado.erro && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-ambar-500 px-4 py-3 font-semibold text-grafite-900 transition hover:bg-ambar-400 disabled:opacity-60"
      >
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
