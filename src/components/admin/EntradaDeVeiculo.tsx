'use client'

import { useActionState, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Campo, ENTRADA } from './campos'
import { formatarReais, paraCentavos } from '@/lib/dinheiro'
import {
  CAMBIOS, CARROCERIAS, CATEGORIAS_CUSTO, COMBUSTIVEIS, ORIGENS,
  ROTULO_CAMBIO, ROTULO_CARROCERIA, ROTULO_CATEGORIA_CUSTO, ROTULO_COMBUSTIVEL, ROTULO_ORIGEM,
} from '@/lib/veiculos-tipos'

// Entrada de veículo em três passos, com o custo sempre visível ao lado.
//
// A ideia que sustenta a tela: o Jair vê o custo subir a cada despesa que
// lança, e o preço sugerido se recalcular junto. É o oposto de descobrir o
// prejuízo depois da venda.
//
// As despesas ficam em estado local até o salvamento. Só no fim tudo vai junto:
// um veículo criado sem as despesas, se ele fechasse a aba no meio, mentiria no
// livro até alguém perceber.

type Despesa = { descricao: string; categoria: string; valor: string }
type Resultado = { erro: string | null }
type Acao = (anterior: Resultado, formulario: FormData) => Promise<Resultado>

const INICIAL: Resultado = { erro: null }

const PASSOS = [
  { numero: '01', rotulo: 'Identificação' },
  { numero: '02', rotulo: 'Compra e despesas' },
  { numero: '03', rotulo: 'Fotos e anúncio' },
]

const SLOTS_FOTO = ['frente', 'lateral', 'traseira', 'interior', 'painel', 'motor']

export function EntradaDeVeiculo({ acao }: { acao: Acao }) {
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)

  const [passo, setPasso] = useState(1)
  const [compra, setCompra] = useState('')
  const [alvo, setAlvo] = useState(12)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [origem, setOrigem] = useState<string>('proprio')

  const consignado = origem === 'consignado'

  const { pago, gastos, custo, venda, lucro } = useMemo(() => {
    const pago = paraCentavos(compra) ?? 0
    const gastos = despesas.reduce((t, d) => t + (paraCentavos(d.valor) ?? 0), 0)
    const custo = pago + gastos
    const venda = Math.round(custo * (1 + alvo / 100))
    return { pago, gastos, custo, venda, lucro: venda - custo }
  }, [compra, despesas, alvo])

  function alterarDespesa(i: number, campo: keyof Despesa, valor: string) {
    setDespesas((atual) => atual.map((d, j) => (j === i ? { ...d, [campo]: valor } : d)))
  }

  return (
    <form action={enviar} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      {/* As despesas viajam como JSON num campo escondido: a tabela é dinâmica
          e o servidor precisa recebê-la inteira, de uma vez. */}
      <input type="hidden" name="despesas" value={JSON.stringify(despesas)} />
      <input type="hidden" name="precoSugerido" value={String(venda)} />

      <div className="min-w-0">
        {/* Navegação de passos: clicável, pra ele voltar e corrigir sem perder
            o que já digitou. */}
        <div className="flex flex-wrap gap-1 border-b border-[var(--color-divider)] pb-2">
          {PASSOS.map((p, i) => {
            const numero = i + 1
            return (
              <button
                key={p.numero}
                type="button"
                onClick={() => setPasso(numero)}
                className="btn btn-ghost"
                aria-current={passo === numero ? 'step' : undefined}
              >
                <span className="jj-num text-muted">{p.numero}</span>
                <span className={passo === numero ? 'text-accent-700' : 'text-text'}>{p.rotulo}</span>
                {passo === numero && <span className="text-[11px] text-muted">— atual</span>}
                {passo > numero && <span className="text-[11px] text-muted">— pronto</span>}
              </button>
            )
          })}
        </div>

        {/* ── Passo 1 ──────────────────────────────────────────────────── */}
        <div className={passo === 1 ? 'mt-4' : 'hidden'}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Marca">
              <input name="marca" required className={ENTRADA} placeholder="Chevrolet" />
            </Campo>
            <Campo rotulo="Modelo e versão">
              <input name="modelo" required className={ENTRADA} placeholder="Onix" />
            </Campo>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Ano de fabricação">
              <input
                name="anoFabricacao" type="number" inputMode="numeric" required
                defaultValue={new Date().getFullYear()} className={`${ENTRADA} jj-num`}
              />
            </Campo>
            <Campo rotulo="Ano do modelo">
              <input
                name="anoModelo" type="number" inputMode="numeric" required
                defaultValue={new Date().getFullYear()} className={`${ENTRADA} jj-num`}
              />
            </Campo>
            <Campo rotulo="Quilometragem">
              <input name="km" type="number" inputMode="numeric" className={`${ENTRADA} jj-num`} />
            </Campo>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Câmbio">
              <select name="cambio" defaultValue="manual" className={ENTRADA}>
                {CAMBIOS.map((c) => (
                  <option key={c} value={c}>{ROTULO_CAMBIO[c]}</option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Combustível">
              <select name="combustivel" defaultValue="flex" className={ENTRADA}>
                {COMBUSTIVEIS.map((c) => (
                  <option key={c} value={c}>{ROTULO_COMBUSTIVEL[c]}</option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Cor">
              <input name="cor" required className={ENTRADA} placeholder="Prata" />
            </Campo>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Carroceria">
              <select name="carroceria" defaultValue="" className={ENTRADA}>
                <option value="">Não informar</option>
                {CARROCERIAS.map((c) => (
                  <option key={c} value={c}>{ROTULO_CARROCERIA[c]}</option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Final da placa" dica="Só o último dígito aparece no site">
              <input name="finalPlaca" maxLength={1} className={`${ENTRADA} jj-num`} />
            </Campo>
            <Campo rotulo="Portas">
              <input name="portas" type="number" defaultValue={4} className={`${ENTRADA} jj-num`} />
            </Campo>
          </div>

          <Campo rotulo="Observações do laudo" className="mt-3" dica="Interno, não aparece no site.">
            <textarea name="observacoesInternas" rows={3} className={ENTRADA} />
          </Campo>

          <fieldset className="mt-4 border-0 p-0">
            <legend className="mb-2 text-[12px] text-muted">Origem</legend>
            <div className="seg">
              {ORIGENS.map((o) => (
                <label key={o} className="seg-opt">
                  <input
                    type="radio" name="origem" value={o}
                    checked={origem === o} onChange={() => setOrigem(o)}
                  />
                  {ROTULO_ORIGEM[o]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* ── Passo 2 ──────────────────────────────────────────────────── */}
        <div className={passo === 2 ? 'mt-4' : 'hidden'}>
          {consignado ? (
            <p className="text-[13px] text-muted">
              Carro consignado não tem valor de compra — ele não é seu. O que entra no seu lucro é a
              comissão, informada na hora de registrar a venda. As despesas abaixo são só as que
              você bancar.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Quanto pagou no carro">
                <input
                  name="valorCompra" inputMode="decimal" className={`${ENTRADA} jj-num`}
                  placeholder="50.000,00" value={compra}
                  onChange={(e) => setCompra(e.target.value)}
                />
              </Campo>
              <Campo rotulo="Data da entrada">
                <input
                  name="dataEntrada" type="date" defaultValue={hoje()} className={`${ENTRADA} jj-num`}
                />
              </Campo>
            </div>
          )}

          <div className="mt-6 flex items-baseline justify-between">
            <h3 className="!text-[20px]">Despesas</h3>
            <span className="text-[11px] text-muted">
              {despesas.length} {despesas.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
          </div>

          {despesas.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th className="w-[150px]">Categoria</th>
                  <th className="w-[120px] text-right">Valor</th>
                  <th className="w-[44px]" />
                </tr>
              </thead>
              <tbody>
                {despesas.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        className={ENTRADA} value={d.descricao} placeholder="ex. troca de pneus"
                        onChange={(e) => alterarDespesa(i, 'descricao', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className={ENTRADA} value={d.categoria}
                        onChange={(e) => alterarDespesa(i, 'categoria', e.target.value)}
                      >
                        {CATEGORIAS_CUSTO.filter((c) => c !== 'compra').map((c) => (
                          <option key={c} value={c}>{ROTULO_CATEGORIA_CUSTO[c]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className={`${ENTRADA} jj-num text-right`} inputMode="decimal"
                        value={d.valor} placeholder="0,00"
                        onChange={(e) => alterarDespesa(i, 'valor', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button" aria-label="Remover despesa" className="btn btn-ghost btn-icon"
                        onClick={() => setDespesas((a) => a.filter((_, j) => j !== i))}
                      >
                        <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() =>
              setDespesas((a) => [...a, { descricao: '', categoria: 'mecanica', valor: '' }])
            }
          >
            + Nova despesa
          </button>
        </div>

        {/* ── Passo 3 ──────────────────────────────────────────────────── */}
        <div className={passo === 3 ? 'mt-4' : 'hidden'}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SLOTS_FOTO.map((s) => (
              <div key={s} className="plate flex aspect-4/3 items-center justify-center">
                <span className="text-[11px] text-muted">{s}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            As fotos são enviadas na próxima tela, depois de salvar — assim elas já entram
            vinculadas a este veículo. A primeira vira a capa do anúncio.
          </p>

          <Campo rotulo="Título do anúncio" className="mt-4" dica="Deixe em branco para usar marca e modelo.">
            <input name="tituloAnuncio" className={ENTRADA} />
          </Campo>

          <Campo rotulo="Descrição" className="mt-3">
            <textarea name="descricao" rows={5} className={ENTRADA} style={{ minHeight: 120 }} />
          </Campo>

          <fieldset className="mt-4 border-0 p-0">
            <legend className="mb-2 text-[12px] text-muted">Publicar</legend>
            <div className="seg">
              <label className="seg-opt">
                <input type="radio" name="publicar" value="site" />
                Já no site
              </label>
              <label className="seg-opt">
                <input type="radio" name="publicar" value="interno" defaultChecked />
                Só interno
              </label>
            </div>
          </fieldset>
        </div>

        {estado.erro && (
          <p role="alert" className="mt-4 mb-0 text-[13px] text-red-800">
            {estado.erro}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--color-divider)] pt-4">
          <button
            type="button" className="btn btn-secondary" disabled={passo === 1}
            onClick={() => setPasso((p) => Math.max(1, p - 1))}
          >
            Voltar
          </button>

          <div className="flex gap-2">
            <button type="submit" name="rascunho" value="1" disabled={enviando} className="btn btn-ghost">
              Salvar rascunho
            </button>
            {passo < 3 ? (
              <button type="button" className="btn btn-primary" onClick={() => setPasso((p) => p + 1)}>
                Continuar
              </button>
            ) : (
              <button type="submit" disabled={enviando} className="btn btn-primary">
                {enviando ? 'Salvando…' : 'Publicar veículo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Aside: o custo ao vivo ───────────────────────────────────────── */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px] lg:self-start">
        <div className="card">
          <h2 className="card-title m-0">Custo deste carro</h2>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[13px] text-muted">Pago no carro</span>
            <span className="jj-num text-[17px]">{formatarReais(pago)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-muted">Despesas lançadas</span>
            <span className="jj-num text-[17px]">{formatarReais(gastos)}</span>
          </div>
          <hr className="hr !my-2" />
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-muted">Custo total</span>
            <span className="jj-num font-heading text-[34px] leading-none font-semibold tracking-[-0.02em]">
              {formatarReais(custo)}
            </span>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title m-0">Preço de venda</h2>

          <div className="mt-2 flex items-baseline justify-between">
            <label htmlFor="alvo" className="text-[13px] text-muted">
              Lucro alvo
            </label>
            <span className="jj-num text-[13px]">{alvo}%</span>
          </div>
          <input
            id="alvo" type="range" min={4} max={30} step={1} value={alvo}
            onChange={(e) => setAlvo(Number(e.target.value))} className="mt-1"
          />

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-[13px] text-muted">Anunciar por</span>
            <span className="jj-num font-heading text-[34px] leading-none font-semibold tracking-[-0.02em] text-accent-700">
              {formatarReais(venda)}
            </span>
          </div>
          <p className="m-0 text-right text-[11px] text-muted">lucro de {formatarReais(lucro)}</p>

          <p className="mt-2 mb-0 text-[11px] text-muted">
            Cada despesa nova sobe o custo e recalcula este preço.
          </p>
        </div>
      </aside>
    </form>
  )
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}
