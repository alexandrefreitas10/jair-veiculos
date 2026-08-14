import { gerarSlug, normalizar } from '@/lib/slug'

describe('normalizar', () => {
  test('tira acento, deixa minúsculo e troca o resto por hífen', () => {
    expect(normalizar('Ônix LT 1.0 Turbo')).toBe('onix-lt-1-0-turbo')
    expect(normalizar('Citroën C3')).toBe('citroen-c3')
  })

  test('não deixa hífen sobrando nas pontas', () => {
    expect(normalizar('  Gol  ')).toBe('gol')
    expect(normalizar('!!!Uno!!!')).toBe('uno')
  })
})

describe('gerarSlug', () => {
  test('monta marca, modelo, versão e ano', () => {
    const slug = gerarSlug({ marca: 'Chevrolet', modelo: 'Onix', versao: 'LT', anoModelo: 2020 })
    expect(slug).toMatch(/^chevrolet-onix-lt-2020-[a-z0-9]{4}$/)
  })

  test('funciona sem versão informada', () => {
    const slug = gerarSlug({ marca: 'Fiat', modelo: 'Uno', versao: null, anoModelo: 2015 })
    expect(slug).toMatch(/^fiat-uno-2015-[a-z0-9]{4}$/)
  })

  test('dois carros iguais geram slugs diferentes', () => {
    // O Jair vende carro repetido. Sem o sufixo, o segundo Onix LT 2020
    // esbarraria na restrição de unicidade na hora do cadastro.
    const dados = { marca: 'Chevrolet', modelo: 'Onix', versao: 'LT', anoModelo: 2020 }
    const gerados = new Set(Array.from({ length: 50 }, () => gerarSlug(dados)))
    expect(gerados.size).toBeGreaterThan(45)
  })
})
