import sql, { initSchema } from '@/lib/db'
import { criarVeiculo, publicar } from '@/lib/veiculos'
import { lancarCusto } from '@/lib/custos'
import { registrarNegocio } from '@/lib/negocios'
import {
  vendasNoPeriodo,
  resumir,
  resumoDoMes,
  resumoEstoque,
  serieMensal,
  carrosParados,
  paraCsv,
} from '@/lib/financeiro'

const rodar = process.env.DATABASE_URL ? describe : describe.skip

async function proprio(valorCompra: number, dataEntrada = '2026-01-10') {
  return criarVeiculo({
    marca: 'Chevrolet', modelo: 'Onix', anoFabricacao: 2019, anoModelo: 2020,
    cambio: 'manual', combustivel: 'flex', cor: 'Prata',
    precoCentavos: 6_200_000, origem: 'proprio',
    valorCompraCentavos: valorCompra, dataEntrada,
  })
}

async function consignado(dataEntrada = '2026-01-10') {
  return criarVeiculo({
    marca: 'Honda', modelo: 'Civic', anoFabricacao: 2018, anoModelo: 2019,
    cambio: 'automatico', combustivel: 'flex', cor: 'Preto',
    precoCentavos: 9_000_000, origem: 'consignado', dataEntrada,
  })
}

rodar('financeiro', () => {
  beforeAll(async () => {
    await initSchema()
  })

  beforeEach(async () => {
    await sql`DELETE FROM negocios`
    await sql`DELETE FROM veiculo_custos`
    await sql`DELETE FROM veiculos`
  })

  describe('resumo do mês', () => {
    test('mês sem venda devolve zeros, não erro', async () => {
      // Mês parado é normal pra quem vende 2 a 5 carros. Se estourasse, toda
      // tela precisaria tratar o caso.
      const r = await resumoDoMes(2026, 3)
      expect(r.vendas).toBe(0)
      expect(r.lucro).toBe(0)
      expect(r.margemMedia).toBeNull()
    })

    test('soma vendas do mês e ignora as de fora', async () => {
      const a = await proprio(5_000_000)
      const b = await proprio(5_000_000)
      await registrarNegocio({ veiculoId: a, valorVendaCentavos: 6_000_000, data: '2026-02-10' })
      await registrarNegocio({ veiculoId: b, valorVendaCentavos: 6_000_000, data: '2026-03-05' })

      const r = await resumoDoMes(2026, 2)
      expect(r.vendas).toBe(1)
      expect(r.lucro).toBe(1_000_000)
    })

    test('venda no último dia do mês entra no mês', async () => {
      const id = await proprio(5_000_000)
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_000_000, data: '2026-02-28' })
      expect((await resumoDoMes(2026, 2)).vendas).toBe(1)
    })

    test('consignado não infla o faturamento dele', async () => {
      // O ponto que sustenta o módulo: o valor do carro dos outros passa pelas
      // mãos dele, mas não é receita dele.
      const id = await consignado()
      await registrarNegocio({
        veiculoId: id, valorVendaCentavos: 9_000_000,
        comissaoRecebidaCentavos: 400_000, data: '2026-02-10',
      })

      const r = await resumoDoMes(2026, 2)
      expect(r.volumeVendido).toBe(9_000_000) // passou pelas mãos dele
      expect(r.receita).toBe(400_000) // é dele
      expect(r.lucro).toBe(400_000)
    })

    test('mistura de próprio e consignado no mesmo mês', async () => {
      const a = await proprio(5_000_000)
      const b = await consignado()
      await lancarCusto({ veiculoId: a, categoria: 'funilaria', valorCentavos: 100_000 })
      await registrarNegocio({ veiculoId: a, valorVendaCentavos: 6_200_000, data: '2026-02-10' })
      await registrarNegocio({
        veiculoId: b, valorVendaCentavos: 9_000_000,
        comissaoRecebidaCentavos: 400_000, data: '2026-02-15',
      })

      const r = await resumoDoMes(2026, 2)
      expect(r.vendas).toBe(2)
      expect(r.lucro).toBe(1_100_000 + 400_000) // (62.000−50.000−1.000) + 4.000
      expect(r.receita).toBe(6_200_000 + 400_000)
    })

    test('prejuízo entra como negativo e derruba o total', async () => {
      const a = await proprio(5_000_000)
      const b = await proprio(6_000_000)
      await registrarNegocio({ veiculoId: a, valorVendaCentavos: 6_000_000, data: '2026-02-10' })
      await registrarNegocio({ veiculoId: b, valorVendaCentavos: 5_500_000, data: '2026-02-11' })

      expect((await resumoDoMes(2026, 2)).lucro).toBe(1_000_000 - 500_000)
    })

    test('tempo de giro conta da entrada até a venda', async () => {
      const id = await proprio(5_000_000, '2026-01-01')
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_000_000, data: '2026-02-10' })
      expect((await resumoDoMes(2026, 2)).giroMedioDias).toBe(40)
    })
  })

  describe('estoque', () => {
    test('capital parado é compra mais custos, só dos carros próprios', async () => {
      const a = await proprio(5_000_000)
      await lancarCusto({ veiculoId: a, categoria: 'mecanica', valorCentavos: 150_000 })
      await consignado() // carro dos outros: não é dinheiro dele parado
      await publicar(a)

      const e = await resumoEstoque()
      expect(e.quantidade).toBe(2)
      expect(e.capitalParado).toBe(5_150_000)
      expect(e.consignados).toBe(1)
    })

    test('carro vendido sai do estoque', async () => {
      const id = await proprio(5_000_000)
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_000_000 })
      expect((await resumoEstoque()).quantidade).toBe(0)
    })

    test('rascunho conta como estoque — o dinheiro já saiu', async () => {
      await proprio(5_000_000)
      expect((await resumoEstoque()).quantidade).toBe(1)
    })

    test('estoque vazio devolve zeros', async () => {
      const e = await resumoEstoque()
      expect(e).toEqual({ quantidade: 0, capitalParado: 0, valorAnunciado: 0, consignados: 0 })
    })
  })

  describe('série mensal', () => {
    test('devolve um ponto por mês, incluindo os vazios', async () => {
      // Um buraco no gráfico diz tanto quanto uma barra alta.
      const serie = await serieMensal(12)
      expect(serie).toHaveLength(12)
      expect(serie.every((p) => typeof p.lucro === 'number')).toBe(true)
    })
  })

  describe('carros parados', () => {
    test('o mais antigo vem primeiro', async () => {
      const velho = await proprio(5_000_000, '2026-01-01')
      const novo = await proprio(5_000_000, '2026-06-01')
      await publicar(velho)
      await publicar(novo)

      const lista = await carrosParados(5)
      expect(lista[0].veiculoId).toBe(velho)
      expect(lista[0].diasParado).toBeGreaterThan(lista[1].diasParado)
    })

    test('rascunho não entra — ainda não está à venda', async () => {
      await proprio(5_000_000, '2026-01-01')
      expect(await carrosParados(5)).toHaveLength(0)
    })
  })

  describe('resumir', () => {
    test('lista vazia não vira NaN', () => {
      const r = resumir([])
      expect(r.lucro).toBe(0)
      expect(r.margemMedia).toBeNull()
      expect(r.lucroMedio).toBeNull()
    })
  })

  describe('CSV', () => {
    test('sai com ponto e vírgula, vírgula decimal e BOM', async () => {
      // Sem BOM e com vírgula, o Excel em português abre tudo numa coluna só
      // e troca "São" por "SÃ£o".
      const id = await proprio(5_000_000)
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_200_000, data: '2026-02-10' })
      const csv = paraCsv(await vendasNoPeriodo('2026-02-01', '2026-02-28'))

      expect(csv.charCodeAt(0)).toBe(0xfeff) // BOM
      expect(csv).toContain('Data;Veículo;Ano')
      expect(csv).toContain('10/02/2026')
      expect(csv).toContain('62000,00')
    })

    test('sem vendas, sai só o cabeçalho', () => {
      const csv = paraCsv([])
      expect(csv.split('\r\n')).toHaveLength(1)
    })
  })
})
