'use client'

import { useActionState, useState } from 'react'
import { Bloco, Campo, ENTRADA, Interruptor } from './campos'
import {
  CAMBIOS, CARROCERIAS, COMBUSTIVEIS, OPCIONAIS, ORIGENS, SELOS,
  ROTULO_CAMBIO, ROTULO_CARROCERIA, ROTULO_COMBUSTIVEL, ROTULO_ORIGEM,
} from '@/lib/veiculos-tipos'
import type { Veiculo } from '@/lib/veiculos'

// Edição de um veículo já cadastrado. A entrada de um carro NOVO usa o assistente
// de três passos (`EntradaDeVeiculo`); aqui é tudo numa página só, porque quem
// edita normalmente vem mexer num campo específico e passos atrapalhariam.

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

  // A origem controla o bloco privado. Mostrar "valor de compra" num consignado
  // convida ao preenchimento errado — e um valor de compra num carro que não é
  // dele comeria o lucro de um negócio que é só comissão.
  const [origem, setOrigem] = useState(veiculo?.origem ?? 'proprio')
  const consignado = origem === 'consignado'

  return (
    <form action={enviar} className="flex flex-col gap-4">
      {veiculo && <input type="hidden" name="id" value={veiculo.id} />}

      <Bloco titulo="O carro" descricao="É o que o comprador vê na ficha técnica.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="Marca">
            <input name="marca" required defaultValue={veiculo?.marca} className={ENTRADA} />
          </Campo>
          <Campo rotulo="Modelo">
            <input name="modelo" required defaultValue={veiculo?.modelo} className={ENTRADA} />
          </Campo>
          <Campo rotulo="Versão" dica="Opcional">
            <input name="versao" defaultValue={veiculo?.versao ?? ''} className={ENTRADA} />
          </Campo>

          <Campo rotulo="Ano de fabricação">
            <input name="anoFabricacao" type="number" required defaultValue={veiculo?.anoFabricacao} className={`${ENTRADA} jj-num`} />
          </Campo>
          <Campo rotulo="Ano do modelo">
            <input name="anoModelo" type="number" required defaultValue={veiculo?.anoModelo} className={`${ENTRADA} jj-num`} />
          </Campo>
          <Campo rotulo="Quilometragem">
            <input name="km" type="number" defaultValue={veiculo?.km ?? 0} className={`${ENTRADA} jj-num`} />
          </Campo>

          <Campo rotulo="Câmbio">
            <select name="cambio" defaultValue={veiculo?.cambio ?? 'manual'} className={ENTRADA}>
              {CAMBIOS.map((c) => (<option key={c} value={c}>{ROTULO_CAMBIO[c]}</option>))}
            </select>
          </Campo>
          <Campo rotulo="Combustível">
            <select name="combustivel" defaultValue={veiculo?.combustivel ?? 'flex'} className={ENTRADA}>
              {COMBUSTIVEIS.map((c) => (<option key={c} value={c}>{ROTULO_COMBUSTIVEL[c]}</option>))}
            </select>
          </Campo>
          <Campo rotulo="Cor">
            <input name="cor" required defaultValue={veiculo?.cor} className={ENTRADA} />
          </Campo>

          <Campo rotulo="Carroceria">
            <select name="carroceria" defaultValue={veiculo?.carroceria ?? ''} className={ENTRADA}>
              <option value="">Não informar</option>
              {CARROCERIAS.map((c) => (<option key={c} value={c}>{ROTULO_CARROCERIA[c]}</option>))}
            </select>
          </Campo>
          <Campo rotulo="Portas">
            <input name="portas" type="number" defaultValue={veiculo?.portas ?? 4} className={`${ENTRADA} jj-num`} />
          </Campo>
          <Campo rotulo="Final da placa" dica="Opcional">
            <input name="finalPlaca" maxLength={1} defaultValue={veiculo?.finalPlaca ?? ''} className={`${ENTRADA} jj-num`} />
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="O anúncio">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Preço de venda" dica="O valor anunciado no site">
            <input name="preco" inputMode="decimal" required defaultValue={emReais(veiculo?.precoCentavos)} className={`${ENTRADA} jj-num`} />
          </Campo>
          <div className="flex flex-col gap-2 sm:pt-5">
            <Interruptor nome="aceitaTroca" rotulo="Aceita troca" padrao={veiculo?.aceitaTroca ?? true} />
            <Interruptor nome="destaque" rotulo="Mostrar em destaque" padrao={veiculo?.destaque ?? false} />
          </div>
        </div>

        <Campo
          rotulo="Descrição"
          className="mt-3"
          dica="Conte o que a ficha não conta: conservação, histórico, por que vale a pena."
        >
          <textarea name="descricao" rows={5} defaultValue={veiculo?.descricao ?? ''} className={ENTRADA} />
        </Campo>

        <fieldset className="mt-4 border-0 p-0">
          <legend className="mb-2 text-[12px] text-muted">Opcionais</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OPCIONAIS.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input
                  type="checkbox" name="opcionais" value={o}
                  defaultChecked={veiculo?.opcionais.includes(o)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      </Bloco>

      <Bloco
        titulo="Documentação"
        descricao="Marque só o que estiver realmente em dia — uma promessa que não se confirma na entrega derruba a venda."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SELOS.map((s) => {
            const chave = s.campo.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())
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

      <Bloco titulo="Só seu" descricao="Nada daqui aparece no site. É o que alimenta o livro.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Origem">
            <select
              name="origem" value={origem}
              onChange={(e) => setOrigem(e.target.value as typeof origem)}
              className={ENTRADA}
            >
              {ORIGENS.map((o) => (<option key={o} value={o}>{ROTULO_ORIGEM[o]}</option>))}
            </select>
          </Campo>

          <Campo rotulo="Entrou no estoque em">
            <input name="dataEntrada" type="date" defaultValue={comoData(veiculo?.dataEntrada)} className={`${ENTRADA} jj-num`} />
          </Campo>

          {!consignado && (
            <Campo rotulo="Quanto você pagou" dica="Base do cálculo de lucro">
              <input name="valorCompra" inputMode="decimal" defaultValue={emReais(veiculo?.valorCompraCentavos)} className={`${ENTRADA} jj-num`} />
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

        <Campo rotulo="Anotações internas" className="mt-3" dica="Só você lê.">
          <textarea name="observacoesInternas" rows={3} defaultValue={veiculo?.observacoesInternas ?? ''} className={ENTRADA} />
        </Campo>
      </Bloco>

      {estado.erro && (
        <p role="alert" className="m-0 text-[13px] text-red-800">
          {estado.erro}
        </p>
      )}

      {/* Grudado no rodapé: o formulário é longo e ele não deveria precisar
          rolar até o fim pra salvar o que acabou de digitar. */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-[var(--color-divider)] bg-bg/95 px-4 py-3 backdrop-blur">
        <button type="submit" disabled={enviando} className="btn btn-primary">
          {enviando ? 'Salvando…' : rotuloBotao}
        </button>
        {estado.salvoEm && !enviando && !estado.erro && (
          <span className="text-[13px] text-accent-700">Salvo.</span>
        )}
      </div>
    </form>
  )
}
