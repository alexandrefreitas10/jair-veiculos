'use client'

import { useActionState, useRef } from 'react'
import { Plus } from 'lucide-react'

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
        // Envia assim que ele escolhe. Um botão "enviar" separado é mais um
        // passo pra esquecer, e aí as fotos não sobem.
        onChange={() => formulario.current?.requestSubmit()}
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        className="btn btn-secondary w-full border-dashed py-6"
      >
        {enviando ? (
          'Processando as fotos…'
        ) : (
          <>
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            Escolher fotos
          </>
        )}
      </button>

      <p className="mt-2 mb-0 text-center text-[11px] text-muted">
        Pode selecionar várias de uma vez. São reduzidas automaticamente para abrir rápido no celular
        do cliente.
      </p>

      {estado.erro && (
        <p role="alert" className="mt-2 mb-0 text-[13px] text-red-800">
          {estado.erro}
        </p>
      )}
    </form>
  )
}
