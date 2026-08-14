'use client'

import { useActionState, useRef, useEffect } from 'react'
import { ENTRADA } from './campos'
import { CATEGORIAS_CUSTO, ROTULO_CATEGORIA_CUSTO } from '@/lib/veiculos-tipos'

type Resultado = { erro: string | null; salvoEm?: number }
type Acao = (anterior: Resultado, formulario: FormData) => Promise<Resultado>

const INICIAL: Resultado = { erro: null }

export function LancarCusto({ veiculoId, acao }: { veiculoId: number; acao: Acao }) {
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)
  const formulario = useRef<HTMLFormElement>(null)

  // Limpa depois de lançar. Ele costuma lançar três ou quatro custos seguidos
  // (funilaria, pneu, documentação), e reaproveitar o valor anterior faria ele
  // repetir um número sem perceber.
  useEffect(() => {
    if (estado.salvoEm && !estado.erro) formulario.current?.reset()
  }, [estado.salvoEm, estado.erro])

  return (
    <form ref={formulario} action={enviar} className="grid gap-3 sm:grid-cols-[10rem_1fr_9rem_auto]">
      <input type="hidden" name="veiculoId" value={veiculoId} />

      <select name="categoria" defaultValue="mecanica" className={ENTRADA} aria-label="Categoria">
        {CATEGORIAS_CUSTO.filter((c) => c !== 'compra').map((c) => (
          <option key={c} value={c}>
            {ROTULO_CATEGORIA_CUSTO[c]}
          </option>
        ))}
      </select>

      <input name="descricao" placeholder="Descrição (opcional)" className={ENTRADA} aria-label="Descrição" />

      <input
        name="valor"
        inputMode="decimal"
        placeholder="0,00"
        required
        className={`${ENTRADA} numero`}
        aria-label="Valor"
      />

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-grafite-100 px-4 py-2.5 font-medium text-grafite-950 transition hover:bg-white disabled:opacity-60"
      >
        {enviando ? '…' : 'Lançar'}
      </button>

      {estado.erro && (
        <p role="alert" className="text-sm text-red-300 sm:col-span-4">
          {estado.erro}
        </p>
      )}
    </form>
  )
}
