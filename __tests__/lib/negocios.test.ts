import sql, { initSchema } from '@/lib/db'
import { criarVeiculo, buscarVeiculo, publicar } from '@/lib/veiculos'
import { lancarCusto } from '@/lib/custos'
import { listarVitrine } from '@/lib/vitrine'
import { registrarNegocio, listarNegocios, buscarNegocioDoVeiculo, cancelarNegocio } from '@/lib/negocios'

const rodar = process.env.DATABASE_URL ? describe : describe.skip

async function carroProprio(valorCompra = 5_000_000) {
  return criarVeiculo({
    marca: 'Chevrolet',
    modelo: 'Onix',
    anoFabricacao: 2019,
    anoModelo: 2020,
    cambio: 'manual',
    combustivel: 'flex',
    cor: 'Prata',
    precoCentavos: 6_200_000,
    origem: 'proprio',
    valorCompraCentavos: valorCompra,
  })
}

async function carroConsignado() {
  return criarVeiculo({
    marca: 'Honda',
    modelo: 'Civic',
    anoFabricacao: 2018,
    anoModelo: 2019,
    cambio: 'automatico',
    combustivel: 'flex',
    cor: 'Preto',
    precoCentavos: 9_000_000,
    origem: 'consignado',
    consignanteNome: 'Maria',
    consignanteContato: '11 99999-0000',
  })
}

rodar('negócios', () => {
  beforeAll(async () => {
    await initSchema()
  })

  beforeEach(async () => {
    await sql`DELETE FROM negocios`
    await sql`DELETE FROM veiculo_custos`
    await sql`DELETE FROM veiculos`
  })

  describe('venda simples', () => {
    test('registrar a venda marca o carro como vendido', async () => {
      const id = await carroProprio()
      await publicar(id)
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_200_000 })
      expect((await buscarVeiculo(id))!.estado).toBe('vendido')
    })

    test('carro vendido some da vitrine na mesma ação', async () => {
      // O Jair não pode precisar lembrar de atualizar dois lugares. Carro
      // vendido continuando anunciado gera contato que ele não pode atender.
      const id = await carroProprio()
      await publicar(id)
      expect(await listarVitrine({})).toHaveLength(1)
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_200_000 })
      expect(await listarVitrine({})).toHaveLength(0)
    })

    test('o lucro considera compra e custos', async () => {
      const id = await carroProprio(5_000_000)
      await lancarCusto({ veiculoId: id, categoria: 'funilaria', valorCentavos: 80_000 })
      await lancarCusto({ veiculoId: id, categoria: 'documentacao', valorCentavos: 120_000 })
      const negocio = await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_200_000 })
      expect(negocio.lucro).toBe(1_000_000) // 62.000 − 50.000 − 2.000
    })

    test('guarda os dados do comprador', async () => {
      const id = await carroProprio()
      await registrarNegocio({
        veiculoId: id,
        valorVendaCentavos: 6_200_000,
        compradorNome: 'Carlos Silva',
        compradorContato: '11 97777-1111',
        formaPagamento: 'financiado',
      })
      const negocio = (await buscarNegocioDoVeiculo(id))!
      expect(negocio.compradorNome).toBe('Carlos Silva')
      expect(negocio.formaPagamento).toBe('financiado')
    })
  })

  describe('consignado', () => {
    test('o lucro é a comissão, não o valor da venda', async () => {
      const id = await carroConsignado()
      const negocio = await registrarNegocio({
        veiculoId: id,
        valorVendaCentavos: 9_000_000,
        comissaoRecebidaCentavos: 400_000,
      })
      expect(negocio.lucro).toBe(400_000)
      expect(negocio.receita).toBe(400_000)
    })

    test('custo que ele bancou sai da comissão', async () => {
      const id = await carroConsignado()
      await lancarCusto({ veiculoId: id, categoria: 'lavagem', valorCentavos: 30_000 })
      const negocio = await registrarNegocio({
        veiculoId: id,
        valorVendaCentavos: 9_000_000,
        comissaoRecebidaCentavos: 400_000,
      })
      expect(negocio.lucro).toBe(370_000)
    })
  })

  describe('troca', () => {
    test('cria o carro que entrou, como rascunho e com o custo avaliado', async () => {
      const vendido = await carroProprio(5_000_000)
      const negocio = await registrarNegocio({
        veiculoId: vendido,
        valorVendaCentavos: 6_000_000,
        entrada: {
          marca: 'Fiat',
          modelo: 'Argo',
          anoFabricacao: 2018,
          anoModelo: 2019,
          cambio: 'manual',
          combustivel: 'flex',
          cor: 'Vermelho',
          valorAvaliadoCentavos: 4_000_000,
        },
      })

      expect(negocio.veiculoEntradaId).not.toBeNull()
      const entrada = (await buscarVeiculo(negocio.veiculoEntradaId!))!

      // Rascunho: o Jair ainda vai fotografar e completar o anúncio.
      expect(entrada.estado).toBe('rascunho')
      // O custo de aquisição é o valor pelo qual ele aceitou o carro. É isso
      // que faz o lucro do PRÓXIMO negócio fechar certo.
      expect(entrada.valorCompraCentavos).toBe(4_000_000)
      expect(entrada.origem).toBe('proprio')
      expect(entrada.marca).toBe('Fiat')
    })

    test('o carro que entrou não aparece na vitrine antes de ser publicado', async () => {
      const vendido = await carroProprio()
      await registrarNegocio({
        veiculoId: vendido,
        valorVendaCentavos: 6_000_000,
        entrada: {
          marca: 'Fiat',
          modelo: 'Argo',
          anoFabricacao: 2018,
          anoModelo: 2019,
          cambio: 'manual',
          combustivel: 'flex',
          cor: 'Vermelho',
          valorAvaliadoCentavos: 4_000_000,
        },
      })
      expect(await listarVitrine({})).toHaveLength(0)
    })

    test('o lucro da venda não é afetado pelo carro que entrou', async () => {
      // A troca não é desconto: o carro que entra vira estoque, com custo
      // próprio. Abater o valor avaliado do lucro desta venda contaria o
      // mesmo dinheiro duas vezes.
      const vendido = await carroProprio(5_000_000)
      const negocio = await registrarNegocio({
        veiculoId: vendido,
        valorVendaCentavos: 6_000_000,
        entrada: {
          marca: 'Fiat',
          modelo: 'Argo',
          anoFabricacao: 2018,
          anoModelo: 2019,
          cambio: 'manual',
          combustivel: 'flex',
          cor: 'Vermelho',
          valorAvaliadoCentavos: 4_000_000,
        },
      })
      expect(negocio.lucro).toBe(1_000_000)
    })
  })

  describe('o que o sistema recusa', () => {
    test('vender o mesmo carro duas vezes', async () => {
      const id = await carroProprio()
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_000_000 })
      await expect(
        registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_500_000 }),
      ).rejects.toThrow(/já foi vendido/i)
    })

    test('vender carro que não existe', async () => {
      await expect(
        registrarNegocio({ veiculoId: 999_999, valorVendaCentavos: 6_000_000 }),
      ).rejects.toThrow(/não encontrado/i)
    })

    test('apagar um carro que já foi vendido', async () => {
      // O histórico financeiro não pode sumir junto com uma faxina de cadastro.
      const id = await carroProprio()
      await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_000_000 })
      await expect(sql`DELETE FROM veiculos WHERE id = ${id}`).rejects.toThrow()
    })
  })

  describe('cancelar', () => {
    test('devolve o carro pra vitrine', async () => {
      const id = await carroProprio()
      const negocio = await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_000_000 })
      await cancelarNegocio(negocio.id)

      expect((await buscarVeiculo(id))!.estado).toBe('disponivel')
      expect(await buscarNegocioDoVeiculo(id)).toBeNull()
    })

    test('depois de cancelar dá pra registrar de novo', async () => {
      const id = await carroProprio()
      const negocio = await registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_000_000 })
      await cancelarNegocio(negocio.id)
      await expect(
        registrarNegocio({ veiculoId: id, valorVendaCentavos: 6_300_000 }),
      ).resolves.toBeDefined()
    })
  })

  test('listarNegocios traz os mais recentes primeiro', async () => {
    const a = await carroProprio()
    const b = await carroProprio()
    await registrarNegocio({ veiculoId: a, valorVendaCentavos: 6_000_000, data: '2026-01-10' })
    await registrarNegocio({ veiculoId: b, valorVendaCentavos: 7_000_000, data: '2026-02-20' })

    const lista = await listarNegocios()
    expect(lista[0].valorVendaCentavos).toBe(7_000_000)
  })
})
