import {
  dataBrasilia,
  mesAtualBrasilia,
  primeiroDiaDoMes,
  ultimoDiaDoMes,
  ultimosMeses,
  formatarData,
  formatarDataPorExtenso,
} from '@/lib/periodo'

describe('dataBrasilia', () => {
  test('venda das 22h de terça é terça, não quarta', () => {
    // O caso que motiva o arquivo inteiro: 22h de 12/08 em Brasília é 01h de
    // 13/08 em UTC. Gravada crua, a venda sumiria do fechamento da terça.
    const instante = new Date('2026-08-13T01:00:00Z')
    expect(dataBrasilia(instante)).toBe('2026-08-12')
  })

  test('venda da noite do dia 31 não cai no mês seguinte', () => {
    const instante = new Date('2026-09-01T02:30:00Z') // 23h30 de 31/08 em Brasília
    expect(dataBrasilia(instante)).toBe('2026-08-31')
  })

  test('meio-dia continua no mesmo dia', () => {
    expect(dataBrasilia(new Date('2026-08-14T15:00:00Z'))).toBe('2026-08-14')
  })

  test('logo depois da meia-noite de Brasília já é o dia novo', () => {
    expect(dataBrasilia(new Date('2026-08-14T03:01:00Z'))).toBe('2026-08-14')
  })

  test('logo antes da meia-noite de Brasília ainda é o dia anterior', () => {
    expect(dataBrasilia(new Date('2026-08-14T02:59:00Z'))).toBe('2026-08-13')
  })
})

test('mesAtualBrasilia acompanha a virada do mês', () => {
  expect(mesAtualBrasilia(new Date('2026-09-01T02:30:00Z'))).toEqual({ ano: 2026, mes: 8 })
})

describe('limites do mês', () => {
  test('primeiro e último dia', () => {
    expect(primeiroDiaDoMes(2026, 8)).toBe('2026-08-01')
    expect(ultimoDiaDoMes(2026, 8)).toBe('2026-08-31')
  })

  test('meses de 30 dias', () => {
    expect(ultimoDiaDoMes(2026, 4)).toBe('2026-04-30')
  })

  test('fevereiro comum e bissexto', () => {
    expect(ultimoDiaDoMes(2026, 2)).toBe('2026-02-28')
    expect(ultimoDiaDoMes(2028, 2)).toBe('2028-02-29')
  })
})

describe('ultimosMeses', () => {
  test('devolve na ordem cronológica, terminando no mês atual', () => {
    const meses = ultimosMeses(3, new Date('2026-08-14T15:00:00Z'))
    expect(meses.map((m) => m.chave)).toEqual(['2026-06', '2026-07', '2026-08'])
  })

  test('atravessa a virada de ano', () => {
    const meses = ultimosMeses(3, new Date('2026-02-10T15:00:00Z'))
    expect(meses.map((m) => m.chave)).toEqual(['2025-12', '2026-01', '2026-02'])
  })

  test('doze meses para o gráfico do painel', () => {
    expect(ultimosMeses(12, new Date('2026-08-14T15:00:00Z'))).toHaveLength(12)
  })
})

describe('formatação', () => {
  test('data do banco vira dd/mm/aaaa', () => {
    expect(formatarData('2026-08-14')).toBe('14/08/2026')
    expect(formatarData(new Date('2026-08-14T12:00:00Z'))).toBe('14/08/2026')
  })

  test('por extenso', () => {
    expect(formatarDataPorExtenso('2026-08-14')).toBe('14 de agosto de 2026')
  })

  test('nulo vira travessão em vez de "Invalid Date"', () => {
    expect(formatarData(null)).toBe('—')
    expect(formatarDataPorExtenso(undefined)).toBe('—')
  })
})
