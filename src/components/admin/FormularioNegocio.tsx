'use client'

import { useActionState, useState } from 'react'
import { Bloco, Campo, ENTRADA } from './campos'
import { formatarReaisCurto } from '@/lib/dinheiro'
import {
  CAMBIOS, COMBUSTIVEIS, FORMAS_PAGAMENTO,
  ROTULO_CAMBIO, ROTULO_COMBUSTIVEL, ROTULO_FORMA_PAGAMENTO,
} from '@/lib/veiculos-tipos'

export type OpcaoVeiculo = {
  id: number
  rotulo: string
  origem: 'proprio' | 'consignado'
  precoCentavos: number
}

type Resultado = { erro: string | null }
type Acao = (anterior: Resultado, formulario: FormData) => Promise<Resultado>

const INICIAL: Resultado = { erro: null }

export function FormularioNegocio({
  veiculos,
  acao,
  veiculoPreSelecionado,
}: {
  veiculos: OpcaoVeiculo[]
  acao: Acao
  veiculoPreSelecionado?: number
}) {
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)
  const [veiculoId, setVeiculoId] = useState(veiculoPreSelecionado ? String(veiculoPreSelecionado) : '')
  const [houveTroca, setHouveTroca] = useState(false)

  const escolhido = veiculos.find((v) => String(v.id) === veiculoId)
  const consignado = escolhido?.origem === 'consignado'

  if (veiculos.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-divider)] px-6 py-12 text-center">
        <p className="text-text">Nenhum carro disponível para vender.</p>
        <p className="mt-1.5 text-sm text-muted">
          Cadastre um veículo primeiro — ou, se já vendeu todos, parabéns.
        </p>
      </div>
    )
  }

  return (
    <form action={enviar} className="space-y-5">
      <Bloco titulo="A venda">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Qual carro" className="sm:col-span-2">
            <select
              name="veiculoId"
              required
              value={veiculoId}
              onChange={(e) => setVeiculoId(e.target.value)}
              className={ENTRADA}
            >
              <option value="">Escolha…</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.rotulo} — {formatarReaisCurto(v.precoCentavos)}
                  {v.origem === 'consignado' ? ' (consignado)' : ''}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Vendido por">
            <input name="valorVenda" inputMode="decimal" required className={`${ENTRADA} jj-num`} placeholder="62.000,00" />
          </Campo>

          <Campo rotulo="Data da venda">
            <input name="data" type="date" defaultValue={hoje()} className={`${ENTRADA} jj-num`} />
          </Campo>

          {/* A comissão só aparece em consignado. Num carro próprio, ela não
              existe — e um valor solto aí viraria receita fantasma. */}
          {consignado && (
            <Campo
              rotulo="Sua comissão"
              className="sm:col-span-2"
              dica="Neste carro, o lucro é a comissão — o valor da venda é do dono do carro."
            >
              <input name="comissaoRecebida" inputMode="decimal" className={`${ENTRADA} jj-num`} placeholder="3.000,00" />
            </Campo>
          )}

          <Campo rotulo="Forma de pagamento">
            <select name="formaPagamento" defaultValue="a_vista" className={ENTRADA}>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {ROTULO_FORMA_PAGAMENTO[f]}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="Comprador" descricao="Opcional, mas ajuda a lembrar de quem foi.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome">
            <input name="compradorNome" className={ENTRADA} />
          </Campo>
          <Campo rotulo="Telefone">
            <input name="compradorContato" inputMode="tel" className={ENTRADA} />
          </Campo>
        </div>
      </Bloco>

      <Bloco
        titulo="Entrou carro na troca?"
        descricao="Se entrou, ele é cadastrado automaticamente no seu estoque, como rascunho, com o valor que você aceitou virando o custo dele."
      >
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="houveTroca"
            checked={houveTroca}
            onChange={(e) => setHouveTroca(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-text">Sim, entrou um carro</span>
        </label>

        {houveTroca && (
          <div className="mt-5 grid gap-4 border-t border-[var(--color-divider)] pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <Campo rotulo="Marca">
              <input name="entradaMarca" required={houveTroca} className={ENTRADA} placeholder="Fiat" />
            </Campo>
            <Campo rotulo="Modelo">
              <input name="entradaModelo" required={houveTroca} className={ENTRADA} placeholder="Argo" />
            </Campo>
            <Campo rotulo="Versão" dica="Opcional">
              <input name="entradaVersao" className={ENTRADA} />
            </Campo>

            <Campo rotulo="Ano de fabricação">
              <input name="entradaAnoFabricacao" type="number" inputMode="numeric" className={`${ENTRADA} jj-num`} />
            </Campo>
            <Campo rotulo="Ano do modelo">
              <input name="entradaAnoModelo" type="number" inputMode="numeric" className={`${ENTRADA} jj-num`} />
            </Campo>
            <Campo rotulo="Quilometragem">
              <input name="entradaKm" type="number" inputMode="numeric" className={`${ENTRADA} jj-num`} />
            </Campo>

            <Campo rotulo="Câmbio">
              <select name="entradaCambio" defaultValue="manual" className={ENTRADA}>
                {CAMBIOS.map((c) => (
                  <option key={c} value={c}>
                    {ROTULO_CAMBIO[c]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Combustível">
              <select name="entradaCombustivel" defaultValue="flex" className={ENTRADA}>
                {COMBUSTIVEIS.map((c) => (
                  <option key={c} value={c}>
                    {ROTULO_COMBUSTIVEL[c]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Cor">
              <input name="entradaCor" className={ENTRADA} />
            </Campo>

            <Campo
              rotulo="Por quanto você aceitou"
              className="sm:col-span-2 lg:col-span-3"
              dica="Vira o custo de compra desse carro. É o que faz o lucro da próxima venda sair certo."
            >
              <input name="entradaValor" inputMode="decimal" required={houveTroca} className={`${ENTRADA} jj-num`} placeholder="40.000,00" />
            </Campo>
          </div>
        )}
      </Bloco>

      <Bloco titulo="Anotações">
        <textarea name="observacoes" rows={3} className={ENTRADA} placeholder="Algo que valha lembrar depois…" />
      </Bloco>

      {estado.erro && (
        <p role="alert" className="rounded-lg px-4 py-3 text-sm text-red-800">
          {estado.erro}
        </p>
      )}

      <div className="sticky bottom-0 -mx-5 border-t border-[var(--color-divider)] bg-bg px-5 py-3.5 backdrop-blur">
        <button
          type="submit"
          disabled={enviando}
          className="btn btn-primary"
        >
          {enviando ? 'Registrando…' : 'Registrar venda'}
        </button>
        <p className="mt-2 text-xs text-muted">
          O carro sai do site automaticamente ao registrar.
        </p>
      </div>
    </form>
  )
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}
