'use client'

import { useActionState } from 'react'
import { entrar, type EstadoLogin } from './acoes'

const INICIAL: EstadoLogin = { erro: null }

export function FormularioLogin({ voltar }: { voltar: string }) {
  const [estado, acao, enviando] = useActionState(entrar, INICIAL)

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="voltar" value={voltar} />

      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>

      {estado.erro && (
        <p
          role="alert"
          className="m-0 rounded-[var(--radius-md)] border border-red-700/30 bg-red-700/5 px-3 py-2 text-[13px] text-red-800"
        >
          {estado.erro}
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn btn-primary btn-block">
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
