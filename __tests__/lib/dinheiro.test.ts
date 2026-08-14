import { paraCentavos, formatarReais, formatarReaisCurto, somar } from '@/lib/dinheiro'

describe('paraCentavos', () => {
  test('aceita o que o Jair digita no celular', () => {
    expect(paraCentavos('62900')).toBe(6_290_000)
    expect(paraCentavos('62.900')).toBe(6_290_000) // ponto de milhar, não decimal
    expect(paraCentavos('62.900,00')).toBe(6_290_000)
    expect(paraCentavos('62900,50')).toBe(6_290_050)
    expect(paraCentavos('R$ 62.900,00')).toBe(6_290_000)
  })

  test('"62.900" é sessenta e dois mil e novecentos, não sessenta e dois e noventa', () => {
    // O erro que custa caro: interpretar o ponto de milhar como decimal
    // transformaria um carro de R$ 62.900 num anúncio de R$ 62,90.
    expect(paraCentavos('62.900')).toBe(6_290_000)
    expect(paraCentavos('62,90')).toBe(6_290)
  })

  test('campo vazio vira null, não zero', () => {
    // Zero significaria "carro de graça"; null significa "não informado".
    expect(paraCentavos('')).toBeNull()
    expect(paraCentavos(null)).toBeNull()
    expect(paraCentavos(undefined)).toBeNull()
  })

  test('número já em reais vira centavos', () => {
    expect(paraCentavos(62900)).toBe(6_290_000)
    expect(paraCentavos(1.5)).toBe(150)
  })

  test('valor negativo continua negativo', () => {
    expect(paraCentavos('-2.500,00')).toBe(-250_000)
  })
})

describe('formatação', () => {
  test('centavos viram reais legíveis', () => {
    expect(formatarReais(6_290_000).replace(/ /g, ' ')).toBe('R$ 62.900,00')
    expect(formatarReaisCurto(6_290_000).replace(/ /g, ' ')).toBe('R$ 62.900')
  })

  test('nulo vira travessão, não "R$ NaN"', () => {
    expect(formatarReais(null)).toBe('—')
    expect(formatarReaisCurto(undefined)).toBe('—')
  })
})

describe('somar', () => {
  test('lista vazia dá zero', () => {
    expect(somar([])).toBe(0)
  })

  test('ignora nulos em vez de virar NaN', () => {
    expect(somar([100, null, 200, undefined])).toBe(300)
  })
})
