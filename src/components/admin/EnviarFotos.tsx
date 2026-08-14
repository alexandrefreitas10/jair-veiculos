'use client'

import { useActionState, useRef } from 'react'

type Resultado = { erro: string | null; salvoEm?: number }
type Acao = (anterior: Resultado, formulario: FormData) => Promise<Resultado>

const INICIAL: Resultado = { erro: null }

export function EnviarFotos({ veiculoId, acao }: { veiculoId: number; acao: Acao }) {
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)
  const entrada = useRef<HTMLInputElement>(null)
  const formulario = useRef<HTMLFormElement>(null)

  return (
    <form ref={formulario} action={enviar}>
      <input type="hidden" name="id" value={veiculoId} />

      <input
        ref={entrada}
        type="file"
        name="fotos"
        accept="image/*"
        multiple
        className="sr-only"
        // Envia assim que ele escolhe. Um botão "enviar" separado é um passo a
        // mais pra esquecer, e aí as fotos não sobem.
        onChange={() => formulario.current?.requestSubmit()}
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-grafite-600 px-5 py-8 text-grafite-300 transition hover:border-ambar-500/60 hover:text-ambar-300 disabled:opacity-60"
      >
        {enviando ? (
          'Processando as fotos…'
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
            </svg>
            Escolher fotos
          </>
        )}
      </button>

      <p className="mt-2 text-center text-xs text-grafite-500">
        Pode selecionar várias de uma vez. São reduzidas automaticamente para abrir rápido no celular
        do cliente.
      </p>

      {estado.erro && (
        <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {estado.erro}
        </p>
      )}
    </form>
  )
}
