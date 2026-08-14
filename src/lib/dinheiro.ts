// Dinheiro é SEMPRE inteiro em centavos. Nunca float.
//
// 0.1 + 0.2 dá 0.30000000000000004 em ponto flutuante. Num sistema que soma
// custo de funilaria com documentação e compara com o valor de venda, esse
// resto aparece como um centavo de diferença que ninguém consegue explicar —
// e o Jair perde a confiança no relatório inteiro por causa dele.

/** "62.900,00", "62900", "R$ 62.900,00" → 6290000 centavos. */
export function paraCentavos(entrada: string | number | null | undefined): number | null {
  if (entrada === null || entrada === undefined || entrada === '') return null
  if (typeof entrada === 'number') return Math.round(entrada * 100)

  const limpo = entrada.replace(/[^\d,.-]/g, '').trim()
  if (!limpo) return null

  // Formato brasileiro: o último separador é o decimal quando vem seguido de
  // 1 ou 2 dígitos. "62.900" é sessenta e dois mil e novecentos, não 62,90 —
  // por isso o ponto com 3 dígitos depois é milhar, não decimal.
  const ultimaVirgula = limpo.lastIndexOf(',')
  const ultimoPonto = limpo.lastIndexOf('.')
  const posSeparador = Math.max(ultimaVirgula, ultimoPonto)

  let inteiros = limpo
  let decimais = '0'
  if (posSeparador > -1) {
    const depois = limpo.slice(posSeparador + 1)
    if (depois.length > 0 && depois.length <= 2) {
      inteiros = limpo.slice(0, posSeparador)
      decimais = depois.padEnd(2, '0')
    }
  }

  const negativo = inteiros.trim().startsWith('-')
  const digitosInteiros = inteiros.replace(/\D/g, '')
  const valor = Number(digitosInteiros || '0') * 100 + Number(decimais.replace(/\D/g, '') || '0')
  if (!Number.isFinite(valor)) return null
  return negativo ? -valor : valor
}

/** 6290000 → "R$ 62.900,00" */
export function formatarReais(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return '—'
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

/** 6290000 → "R$ 62.900" — para vitrine, onde os centavos só poluem. */
export function formatarReaisCurto(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return '—'
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

/** Soma tolerante a nulo — lista vazia dá 0, não NaN. */
export function somar(valores: Array<number | null | undefined>): number {
  return valores.reduce<number>((total, v) => total + (v ?? 0), 0)
}

/** 12345 km → "12.345 km" */
export function formatarKm(km: number | null | undefined): string {
  if (km === null || km === undefined) return '—'
  return `${km.toLocaleString('pt-BR')} km`
}
