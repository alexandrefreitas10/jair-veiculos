'use client'

import { useActionState, useState } from 'react'
import { Bloco, Campo, ENTRADA, Interruptor } from './campos'
import {
  CAMBIOS, CARROCERIAS, COMBUSTIVEIS, OPCIONAIS, ORIGENS, SELOS,
  ROTULO_CAMBIO, ROTULO_CARROCERIA, ROTULO_COMBUSTIVEL, ROTULO_ORIGEM,
} from '@/lib/veiculos-tipos'
import type { Veiculo } from '@/lib/veiculos'

type Resultado = { erro: string | null; salvoEm?: number }
type Acao = (anterior: Resultado, formulario: FormData) => Promise<Resultado>

const INICIAL: Resultado = { erro: null }

const emReais = (centavos: number | null | undefined) =>
  centavos === null || centavos === undefined || centavos === 0
    ? ''
    : (centavos / 100).toFixed(2).replace('.', ',')

const comoData = (d: Date | string | null | undefined) => {
  if (!d) return ''
  return typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)
}

export function FormularioVeiculo({
  acao,
  veiculo,
  rotuloBotao,
}: {
  acao: Acao
  veiculo?: Veiculo
  rotuloBotao: string
}) {
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)

  // A origem controla quais campos aparecem no bloco privado. Mostrar "valor de
  // compra" num consignado convida ao preenchimento errado — e um valor de
  // compra num carro que não é dele comeria o lucro de um negócio de comissão.
  const [origem, setOrigem] = useState(veiculo?.origem ?? 'proprio')
  const consignado = origem === 'consignado'

  return (
    <form action={enviar} className="space-y-5">
      {veiculo && <input type="hidden" name="id" value={veiculo.id} />}

      <Bloco titulo="O carro" descricao="É o que o comprador vê na ficha técnica.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="Marca">
            <input name="marca" required defaultValue={veiculo?.marca} className={ENTRADA} placeholder="Chevrolet" />
          </Campo>
          <Campo rotulo="Modelo">
            <input name="modelo" required defaultValue={veiculo?.modelo} className={ENTRADA} placeholder="Onix" />
          </Campo>
          <Campo rotulo="Versão" dica="Opcional">
            <input name="versao" defaultValue={veiculo?.versao ?? ''} className={ENTRADA} placeholder="LT 1.0 Turbo" />
          </Campo>

          <Campo rotulo="Ano de fabricação">
            <input
              name="anoFabricacao" type="number" inputMode="numeric" required
              defaultValue={veiculo?.anoFabricacao ?? new Date().getFullYear()}
              className={`${ENTRADA} numero`}
            />
          </Campo>
          <Campo rotulo="Ano do modelo">
            <input
              name="anoModelo" type="number" inputMode="numeric" required
              defaultValue={veiculo?.anoModelo ?? new Date().getFullYear()}
              className={`${ENTRADA} numero`}
            />
          </Campo>
          <Campo rotulo="Quilometragem">
            <input
              name="km" type="number" inputMode="numeric"
              defaultValue={veiculo?.km ?? 0}
              className={`${ENTRADA} numero`}
            />
          </Campo>

          <Campo rotulo="Câmbio">
            <select name="cambio" defaultValue={veiculo?.cambio ?? 'manual'} className={ENTRADA}>
              {CAMBIOS.map((c) => (
                <option key={c} value={c}>{ROTULO_CAMBIO[c]}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Combustível">
            <select name="combustivel" defaultValue={veiculo?.combustivel ?? 'flex'} className={ENTRADA}>
              {COMBUSTIVEIS.map((c) => (
                <option key={c} value={c}>{ROTULO_COMBUSTIVEL[c]}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Cor">
            <input name="cor" required defaultValue={veiculo?.cor} className={ENTRADA} placeholder="Prata" />
          </Campo>

          <Campo rotulo="Carroceria">
            <select name="carroceria" defaultValue={veiculo?.carroceria ?? ''} className={ENTRADA}>
              <option value="">Não informar</option>
              {CARROCERIAS.map((c) => (
                <option key={c} value={c}>{ROTULO_CARROCERIA[c]}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Portas">
            <input name="portas" type="number" inputMode="numeric" defaultValue={veiculo?.portas ?? 4} className={`${ENTRADA} numero`} />
          </Campo>
          <Campo rotulo="Final da placa" dica="Opcional">
            <input name="finalPlaca" maxLength={1} defaultValue={veiculo?.finalPlaca ?? ''} className={`${ENTRADA} numero`} />
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="O anúncio">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Preço de venda" dica="O valor anunciado no site">
            <input
              name="preco" inputMode="decimal" required
              defaultValue={emReais(veiculo?.precoCentavos)}
              className={`${ENTRADA} numero`} placeholder="62.900,00"
            />
          </Campo>
          <div className="flex flex-col gap-3 sm:pt-6">
            <Interruptor nome="aceitaTroca" rotulo="Aceita troca" padrao={veiculo?.aceitaTroca ?? true} />
            <Interruptor nome="destaque" rotulo="Mostrar em destaque na home" padrao={veiculo?.destaque ?? false} />
          </div>
        </div>

        <Campo rotulo="Descrição" className="mt-4" dica="Conte o que a ficha técnica não conta: estado de conservação, histórico, por que vale a pena.">
          <textarea name="descricao" rows={5} defaultValue={veiculo?.descricao ?? ''} className={ENTRADA} />
        </Campo>

        <fieldset className="mt-5">
          <legend className="etiqueta mb-2">Opcionais</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OPCIONAIS.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2.5 text-sm text-grafite-300">
                <input
                  type="checkbox" name="opcionais" value={o}
                  defaultChecked={veiculo?.opcionais.includes(o)}
                  className="h-4 w-4 accent-ambar-500"
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      </Bloco>

      <Bloco
        titulo="Documentação"
        descricao="Marque só o que estiver realmente em dia — é o que dá confiança, e uma promessa que não se confirma na hora da entrega derruba a venda."
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {SELOS.map((s) => {
            const chave = paraChaveDoSelo(s.campo)
            return (
              <Interruptor
                key={s.campo}
                nome={chave}
                rotulo={s.rotulo}
                padrao={Boolean(veiculo?.[chave as keyof Veiculo])}
              />
            )
          })}
        </div>
      </Bloco>

      <Bloco
        titulo="Só seu"
        descricao="Nada daqui aparece no site. É o que alimenta o financeiro."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Origem">
            <select
              name="origem" value={origem}
              onChange={(e) => setOrigem(e.target.value as typeof origem)}
              className={ENTRADA}
            >
              {ORIGENS.map((o) => (
                <option key={o} value={o}>{ROTULO_ORIGEM[o]}</option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Entrou no estoque em">
            <input
              name="dataEntrada" type="date"
              defaultValue={comoData(veiculo?.dataEntrada) || hoje()}
              className={`${ENTRADA} numero`}
            />
          </Campo>

          {!consignado && (
            <Campo rotulo="Quanto você pagou" dica="Base do cálculo de lucro">
              <input
                name="valorCompra" inputMode="decimal"
                defaultValue={emReais(veiculo?.valorCompraCentavos)}
                className={`${ENTRADA} numero`} placeholder="50.000,00"
              />
            </Campo>
          )}

          {consignado && (
            <>
              <Campo rotulo="Dono do carro">
                <input name="consignanteNome" defaultValue={veiculo?.consignanteNome ?? ''} className={ENTRADA} />
              </Campo>
              <Campo rotulo="Contato do dono">
                <input name="consignanteContato" defaultValue={veiculo?.consignanteContato ?? ''} className={ENTRADA} />
              </Campo>
            </>
          )}
        </div>

        <Campo rotulo="Anotações internas" className="mt-4" dica="Só você lê.">
          <textarea name="observacoesInternas" rows={3} defaultValue={veiculo?.observacoesInternas ?? ''} className={ENTRADA} />
        </Campo>
      </Bloco>

      {estado.erro && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {estado.erro}
        </p>
      )}

      {/* Fica grudado no rodapé: o formulário é longo e o Jair não deveria
          precisar rolar até o fim pra salvar o que acabou de digitar. */}
      <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-grafite-800 bg-grafite-950/95 px-5 py-3.5 backdrop-blur">
        <button
          type="submit" disabled={enviando}
          className="rounded-lg bg-ambar-500 px-5 py-2.5 font-semibold text-grafite-950 transition hover:bg-ambar-400 disabled:opacity-60"
        >
          {enviando ? 'Salvando…' : rotuloBotao}
        </button>
        {estado.salvoEm && !enviando && !estado.erro && (
          <span className="text-sm text-conferido">Salvo.</span>
        )}
      </div>
    </form>
  )
}

/** 'ipva_pago' → 'ipvaPago'. Os selos vivem em lista no banco em snake_case e
 *  em camelCase no TypeScript; converter aqui evita manter dois mapas. */
function paraChaveDoSelo(campo: string): string {
  return campo.replace(/_([a-z])/g, (_, letra: string) => letra.toUpperCase())
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}
