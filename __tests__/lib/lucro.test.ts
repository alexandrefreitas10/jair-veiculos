import { calcularLucro } from '@/lib/lucro'

// Valores em centavos. 6_200_000 = R$ 62.000,00.

describe('carro próprio', () => {
  test('lucro é venda menos compra menos custos', () => {
    const r = calcularLucro({
      origem: 'proprio',
      valorCompraCentavos: 5_000_000, // R$ 50.000
      custosCentavos: [80_000, 120_000], // R$ 800 + R$ 1.200
      valorVendaCentavos: 6_200_000, // R$ 62.000
      comissaoRecebidaCentavos: null,
    })
    expect(r.receita).toBe(6_200_000)
    expect(r.custoTotal).toBe(5_200_000)
    expect(r.lucro).toBe(1_000_000) // R$ 10.000
  })

  test('prejuízo aparece como negativo, não como zero', () => {
    const r = calcularLucro({
      origem: 'proprio',
      valorCompraCentavos: 6_000_000,
      custosCentavos: [50_000],
      valorVendaCentavos: 5_800_000,
      comissaoRecebidaCentavos: null,
    })
    expect(r.lucro).toBe(-250_000) // −R$ 2.500
  })

  test('carro sem custos lançados ainda calcula', () => {
    const r = calcularLucro({
      origem: 'proprio',
      valorCompraCentavos: 5_000_000,
      custosCentavos: [],
      valorVendaCentavos: 5_500_000,
      comissaoRecebidaCentavos: null,
    })
    expect(r.lucro).toBe(500_000)
  })
})

describe('consignado', () => {
  test('a receita é a comissão, não o valor da venda', () => {
    const r = calcularLucro({
      origem: 'consignado',
      valorCompraCentavos: null,
      custosCentavos: [30_000], // R$ 300 que ele bancou (lavagem)
      valorVendaCentavos: 6_200_000,
      comissaoRecebidaCentavos: 300_000, // R$ 3.000
    })
    // Se a receita fosse o valor da venda, o faturamento do Jair pareceria
    // vinte vezes maior do que é — e ele tomaria decisão em cima disso.
    expect(r.receita).toBe(300_000)
    expect(r.lucro).toBe(270_000) // R$ 2.700
  })

  test('o dinheiro do carro dos outros não entra como lucro dele', () => {
    const r = calcularLucro({
      origem: 'consignado',
      valorCompraCentavos: null,
      custosCentavos: [],
      valorVendaCentavos: 10_000_000,
      comissaoRecebidaCentavos: 500_000,
    })
    expect(r.lucro).toBe(500_000)
  })

  test('consignado sem comissão informada não vira lucro do valor da venda', () => {
    const r = calcularLucro({
      origem: 'consignado',
      valorCompraCentavos: null,
      custosCentavos: [],
      valorVendaCentavos: 10_000_000,
      comissaoRecebidaCentavos: null,
    })
    expect(r.receita).toBe(0)
    expect(r.lucro).toBe(0)
  })
})

describe('margem', () => {
  test('é percentual sobre a receita', () => {
    const r = calcularLucro({
      origem: 'proprio',
      valorCompraCentavos: 5_000_000,
      custosCentavos: [],
      valorVendaCentavos: 10_000_000,
      comissaoRecebidaCentavos: null,
    })
    expect(r.margem).toBeCloseTo(50, 5)
  })

  test('receita zero devolve null, não NaN e não zero', () => {
    // NaN vaza pra tela como "NaN%" e zero mentiria dizendo que a margem foi
    // ruim, quando na verdade não há o que calcular.
    const r = calcularLucro({
      origem: 'consignado',
      valorCompraCentavos: null,
      custosCentavos: [],
      valorVendaCentavos: 0,
      comissaoRecebidaCentavos: 0,
    })
    expect(r.margem).toBeNull()
  })
})

describe('carro próprio sem valor de compra informado', () => {
  test('trata compra ausente como zero, sem quebrar', () => {
    // Acontece com o carro que entrou numa troca antes do Jair completar o
    // cadastro. O relatório precisa continuar de pé.
    const r = calcularLucro({
      origem: 'proprio',
      valorCompraCentavos: null,
      custosCentavos: [10_000],
      valorVendaCentavos: 5_000_000,
      comissaoRecebidaCentavos: null,
    })
    expect(r.custoTotal).toBe(10_000)
    expect(r.lucro).toBe(4_990_000)
  })
})
