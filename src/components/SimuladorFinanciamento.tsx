'use client'

import { useState } from 'react'
import { formatarReais, formatarReaisCurto } from '@/lib/dinheiro'
import { calcularParcela, entradaEmCentavos, ENTRADA_PADRAO, PRAZO_PADRAO } from '@/lib/financiamento'

// Simulador do handoff. A conta é a tabela Price e mora em `lib/financiamento`,
// testada — aqui só tem tela.
//
// A ressalva embaixo da parcela não é rodapé jurídico decorativo: sem ela o
// número vira promessa de crédito aprovado, e quem chega na loja esperando
// aquela parcela e ouve outra sai com razão de reclamar.

export function SimuladorFinanciamento({
  precoCentavos,
  taxaMensal,
  prazos,
  ressalva,
}: {
  precoCentavos: number
  taxaMensal: number
  prazos: number[]
  ressalva: string
}) {
  const [entrada, setEntrada] = useState(ENTRADA_PADRAO)
  const [prazo, setPrazo] = useState(prazos.includes(PRAZO_PADRAO) ? PRAZO_PADRAO : prazos[0])

  const parcela = calcularParcela(precoCentavos, entrada, prazo, taxaMensal)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="entrada" className="text-[13px] text-muted">
          Entrada
        </label>
        <span className="jj-num text-[13px]">
          {formatarReaisCurto(entradaEmCentavos(precoCentavos, entrada))}
          <span className="text-muted"> · {entrada}%</span>
        </span>
      </div>

      <input
        id="entrada"
        type="range"
        min={10}
        max={70}
        step={5}
        value={entrada}
        onChange={(e) => setEntrada(Number(e.target.value))}
        className="mt-2"
      />

      <fieldset className="mt-4 border-0 p-0">
        <legend className="mb-2 text-[13px] text-muted">Prazo</legend>
        {/* Largura total com cada opção em flex:1 — no celular o handoff exige
            alvo de toque de 44px, que o .seg-opt já garante. */}
        <div className="seg w-full">
          {prazos.map((p) => (
            <label key={p} className="seg-opt flex-1 justify-center">
              <input
                type="radio"
                name="prazo"
                value={p}
                checked={prazo === p}
                onChange={() => setPrazo(p)}
              />
              <span className="jj-num">{p}x</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="jj-num text-[13px] text-muted">{prazo} parcelas de</span>
        <span className="jj-num font-heading text-[25px] leading-none font-semibold tracking-[-0.02em] text-accent-700">
          {formatarReais(parcela)}
        </span>
      </div>

      <p className="mt-2 mb-0 text-[11px] text-muted">{ressalva}</p>
    </div>
  )
}
