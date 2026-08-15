import { calcularParcela, parcelaAPartirDe, entradaEmCentavos } from '@/lib/financiamento'

// Valores em centavos. 6_000_000 = R$ 60.000,00.
//
// A conta é a tabela Price, a mesma do protótipo do handoff. Um erro aqui
// aparece como um número plausível na tela — que é o pior tipo de erro em
// dinheiro, porque ninguém desconfia.

describe('calcularParcela', () => {
  test('carro de R$ 60.000, 20% de entrada, 48 meses', () => {
    // financiado = 48.000; i = 1,49% a.m.; n = 48 → ~R$ 1.407
    const parcela = calcularParcela(6_000_000, 20, 48)
    expect(parcela / 100).toBeCloseTo(1407, 0)
  })

  test('mais entrada, parcela menor', () => {
    const pouca = calcularParcela(6_000_000, 10, 48)
    const muita = calcularParcela(6_000_000, 50, 48)
    expect(muita).toBeLessThan(pouca)
  })

  test('mais prazo, parcela menor', () => {
    expect(calcularParcela(6_000_000, 20, 60)).toBeLessThan(calcularParcela(6_000_000, 20, 24))
  })

  test('mais prazo, total pago maior — os juros não somem', () => {
    const em24 = calcularParcela(6_000_000, 20, 24) * 24
    const em60 = calcularParcela(6_000_000, 20, 60) * 60
    expect(em60).toBeGreaterThan(em24)
  })

  test('entrada de 100% não gera parcela', () => {
    expect(calcularParcela(6_000_000, 100, 48)).toBe(0)
  })

  test('taxa zero vira divisão simples, sem estourar', () => {
    // A fórmula da Price divide por ((1+i)^n − 1), que é zero quando i = 0.
    expect(calcularParcela(4_800_000, 0, 48, 0)).toBe(100_000)
  })

  test('preço zero não vira NaN', () => {
    expect(calcularParcela(0, 20, 48)).toBe(0)
  })

  test('devolve inteiro — centavo quebrado não existe', () => {
    expect(Number.isInteger(calcularParcela(6_290_000, 17, 36))).toBe(true)
  })
})

describe('parcelaAPartirDe', () => {
  test('usa o cenário de menor parcela entre os oferecidos', () => {
    // É o que sustenta o "a partir de" do card: qualquer outra combinação
    // oferecida pelo site dá uma parcela maior que esta.
    const aPartirDe = parcelaAPartirDe(6_000_000)
    for (const entrada of [10, 20, 30, 40, 50]) {
      for (const prazo of [24, 36, 48, 60]) {
        expect(calcularParcela(6_000_000, entrada, prazo)).toBeGreaterThanOrEqual(aPartirDe)
      }
    }
  })
})

describe('entradaEmCentavos', () => {
  test('converte o percentual em dinheiro', () => {
    expect(entradaEmCentavos(6_000_000, 20)).toBe(1_200_000)
    expect(entradaEmCentavos(6_290_000, 15)).toBe(943_500)
  })
})
