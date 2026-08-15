'use client'

import { useActionState, useEffect, useRef } from 'react'
import { CATEGORIAS_CUSTO, ROTULO_CATEGORIA_CUSTO } from '@/lib/veiculos-tipos'

type Resultado = { erro: string | null; salvoEm?: number }
type Acao = (anterior: Resultado, formulario: FormData) => Promise<Resultado>

const INICIAL: Resultado = { erro: null }

export function LancarCusto({ veiculoId, acao }: { veiculoId: number; acao: Acao }) {
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)
  const formulario = useRef<HTMLFormElement>(null)

  // Limpa depois de lançar. Ele costuma lançar três ou quatro gastos seguidos
  // (funilaria, pneu, documentação), e reaproveitar o valor anterior faria ele
  // repetir um número sem perceber.
  useEffect(() => {
    if (estado.salvoEm && !estado.erro) formulario.current?.reset()
  }, [estado.salvoEm, estado.erro])

  return (
    <form ref={formulario} action={enviar}>
      <input type="hidden" name="veiculoId" value={veiculoId} />

      <div className="flex gap-2">
        <div className="field flex-1">
          <label htmlFor="descricao-custo">Novo lançamento</label>
          <input
            id="descricao-custo"
            name="descricao"
            className="input"
            placeholder="ex. troca de pneus"
          />
        </div>
        <div className="field w-[110px]">
          <label htmlFor="valor-custo">Valor</label>
          <input
            id="valor-custo"
            name="valor"
            inputMode="decimal"
            required
            className="input jj-num"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="field mt-2">
        <label htmlFor="categoria-custo">Categoria</label>
        <select id="categoria-custo" name="categoria" defaultValue="mecanica" className="input">
          {CATEGORIAS_CUSTO.filter((c) => c !== 'compra').map((c) => (
            <option key={c} value={c}>
              {ROTULO_CATEGORIA_CUSTO[c]}
            </option>
          ))}
        </select>
      </div>

      {estado.erro && (
        <p role="alert" className="mt-2 mb-0 text-[13px] text-red-800">
          {estado.erro}
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn btn-primary btn-block">
        {enviando ? 'Adicionando…' : 'Adicionar ao livro'}
      </button>
    </form>
  )
}
