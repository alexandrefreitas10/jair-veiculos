import { SITE } from '@/lib/config-site'

// Simulador de financiamento — tabela Price, exatamente como o protótipo do
// handoff calcula:
//
//   financiado = preço × (1 − entrada%)
//   parcela    = financiado × (i × (1+i)^n) / ((1+i)^n − 1)
//
// Tudo em centavos inteiros, como o resto do sistema. A conversão para reais
// acontece só na hora de exibir.

export const ENTRADA_PADRAO = 20
export const PRAZO_PADRAO = 48

/** Valor da parcela, em centavos. */
export function calcularParcela(
  precoCentavos: number,
  entradaPercentual: number,
  prazoMeses: number,
  taxaMensal = SITE.financiamento.taxaMensal,
): number {
  const financiado = precoCentavos * (1 - entradaPercentual / 100)

  if (financiado <= 0 || prazoMeses <= 0) return 0

  // Taxa zero viraria divisão por zero na fórmula da Price; nesse caso a
  // parcela é a divisão simples.
  if (taxaMensal === 0) return Math.round(financiado / prazoMeses)

  const fator = Math.pow(1 + taxaMensal, prazoMeses)
  return Math.round((financiado * (taxaMensal * fator)) / (fator - 1))
}

/** O "a partir de R$ X/mês" que aparece no card da vitrine.
 *
 *  Usa 50% de entrada em 60 meses — o cenário que produz a menor parcela entre
 *  os oferecidos. É o número que o handoff mostra no card, e a palavra "a
 *  partir de" é o que o torna honesto: qualquer outra combinação dá mais. */
export function parcelaAPartirDe(precoCentavos: number): number {
  return calcularParcela(precoCentavos, 50, 60)
}

export function entradaEmCentavos(precoCentavos: number, entradaPercentual: number): number {
  return Math.round(precoCentavos * (entradaPercentual / 100))
}
