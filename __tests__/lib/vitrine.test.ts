import sql, { initSchema } from '@/lib/db'
import { criarVeiculo, publicar, mudarEstado } from '@/lib/veiculos'
import { listarVitrine, buscarAnuncio, listarDestaques, slugsPublicados } from '@/lib/vitrine'

const rodar = process.env.DATABASE_URL ? describe : describe.skip

// Nomes de campo privado, nas duas grafias — a do banco e a do TypeScript.
// Se um dia alguém trocar o mapeamento manual por um `SELECT *` com conversão
// automática, é aqui que o vazamento aparece.
const CAMPOS_PROIBIDOS = [
  'valor_compra',
  'valorCompra',
  'consignante_nome',
  'consignanteNome',
  'consignante_contato',
  'consignanteContato',
  'comissao',
  'comissao_tipo',
  'comissaoTipo',
  'observacoes_internas',
  'observacoesInternas',
]

const VALOR_COMPRA = 4_500_000 // R$ 45.000 — o que o Jair pagou
const CONSIGNANTE = 'Maria Aparecida Sobrenome Raro'

async function carroDeTeste(extras: Record<string, unknown> = {}) {
  return criarVeiculo({
    marca: 'Chevrolet',
    modelo: 'Onix',
    versao: 'LT 1.0',
    anoFabricacao: 2019,
    anoModelo: 2020,
    km: 48_000,
    cambio: 'manual',
    combustivel: 'flex',
    cor: 'Prata',
    precoCentavos: 6_290_000,
    origem: 'proprio',
    valorCompraCentavos: VALOR_COMPRA,
    consignanteNome: CONSIGNANTE,
    consignanteContato: '11 98888-7777',
    observacoesInternas: 'Dono anterior devia IPVA de 2023',
    ...extras,
  } as Parameters<typeof criarVeiculo>[0])
}

rodar('vitrine pública', () => {
  beforeAll(async () => {
    await initSchema()
  })

  beforeEach(async () => {
    await sql`DELETE FROM negocios`
    await sql`DELETE FROM veiculos`
  })

  test('nenhum campo privado sai na listagem', async () => {
    const id = await carroDeTeste()
    await publicar(id)

    const lista = await listarVitrine({})
    expect(lista).toHaveLength(1)

    const bruto = JSON.stringify(lista)
    for (const campo of CAMPOS_PROIBIDOS) {
      expect(bruto).not.toContain(campo)
    }
    // O valor em si também não pode aparecer, mesmo com outro nome de campo.
    expect(bruto).not.toContain(String(VALOR_COMPRA))
    expect(bruto).not.toContain(CONSIGNANTE)
  })

  test('nenhum campo privado sai na página do anúncio', async () => {
    const id = await carroDeTeste()
    await publicar(id)
    const { slug } = (await listarVitrine({}))[0]

    const anuncio = await buscarAnuncio(slug)
    expect(anuncio).not.toBeNull()

    const bruto = JSON.stringify(anuncio)
    for (const campo of CAMPOS_PROIBIDOS) {
      expect(bruto).not.toContain(campo)
    }
    expect(bruto).not.toContain(String(VALOR_COMPRA))
    expect(bruto).not.toContain(CONSIGNANTE)
  })

  test('o anúncio traz o que o comprador precisa ver', async () => {
    const id = await carroDeTeste()
    await publicar(id)
    const anuncio = (await buscarAnuncio((await listarVitrine({}))[0].slug))!

    expect(anuncio.marca).toBe('Chevrolet')
    expect(anuncio.precoCentavos).toBe(6_290_000)
    expect(anuncio.km).toBe(48_000)
    expect(anuncio.anoModelo).toBe(2020)
  })

  describe('o que aparece e o que não aparece', () => {
    test('rascunho não aparece', async () => {
      await carroDeTeste() // nasce como rascunho
      expect(await listarVitrine({})).toHaveLength(0)
    })

    test('vendido some da vitrine', async () => {
      const id = await carroDeTeste()
      await publicar(id)
      expect(await listarVitrine({})).toHaveLength(1)
      await mudarEstado(id, 'vendido')
      expect(await listarVitrine({})).toHaveLength(0)
    })

    test('arquivado não aparece', async () => {
      const id = await carroDeTeste()
      await mudarEstado(id, 'arquivado')
      expect(await listarVitrine({})).toHaveLength(0)
    })

    test('reservado ainda aparece — chama interessado pro caso de cair', async () => {
      const id = await carroDeTeste()
      await mudarEstado(id, 'reservado')
      expect(await listarVitrine({})).toHaveLength(1)
    })

    test('buscar anúncio de carro não publicado devolve null', async () => {
      const id = await carroDeTeste()
      const veiculo = await sql<{ slug: string }[]>`SELECT slug FROM veiculos WHERE id = ${id}`
      expect(await buscarAnuncio(veiculo[0].slug)).toBeNull()
    })
  })

  describe('filtros', () => {
    beforeEach(async () => {
      const a = await carroDeTeste({ marca: 'Fiat', modelo: 'Argo', precoCentavos: 4_500_000, km: 30_000, cambio: 'manual' })
      const b = await carroDeTeste({ marca: 'Honda', modelo: 'Civic', precoCentavos: 9_800_000, km: 80_000, cambio: 'automatico' })
      await publicar(a)
      await publicar(b)
    })

    test('por marca', async () => {
      const r = await listarVitrine({ marca: 'Fiat' })
      expect(r).toHaveLength(1)
      expect(r[0].modelo).toBe('Argo')
    })

    test('por faixa de preço', async () => {
      const r = await listarVitrine({ precoMax: 5_000_000 })
      expect(r).toHaveLength(1)
      expect(r[0].marca).toBe('Fiat')
    })

    test('por câmbio', async () => {
      const r = await listarVitrine({ cambio: 'automatico' })
      expect(r).toHaveLength(1)
      expect(r[0].modelo).toBe('Civic')
    })

    test('busca livre acha por marca ou modelo', async () => {
      expect(await listarVitrine({ busca: 'civic' })).toHaveLength(1)
      expect(await listarVitrine({ busca: 'CIVIC' })).toHaveLength(1)
      expect(await listarVitrine({ busca: 'nao-existe' })).toHaveLength(0)
    })

    test('ordena por menor preço', async () => {
      const r = await listarVitrine({ ordem: 'preco_asc' })
      expect(r[0].marca).toBe('Fiat')
    })

    test('ordena por maior preço', async () => {
      const r = await listarVitrine({ ordem: 'preco_desc' })
      expect(r[0].marca).toBe('Honda')
    })

    test('filtro sem resultado devolve lista vazia, não erro', async () => {
      expect(await listarVitrine({ marca: 'Ferrari' })).toEqual([])
    })
  })

  test('destaques trazem só os marcados e publicados', async () => {
    const comum = await carroDeTeste()
    const destaque = await carroDeTeste({ modelo: 'Tracker', destaque: true })
    const rascunhoDestaque = await carroDeTeste({ modelo: 'Spin', destaque: true })
    await publicar(comum)
    await publicar(destaque)
    void rascunhoDestaque // fica em rascunho de propósito

    const r = await listarDestaques(10)
    expect(r).toHaveLength(1)
    expect(r[0].modelo).toBe('Tracker')
  })

  test('o sitemap lista só o que está no ar', async () => {
    const publicado = await carroDeTeste()
    await publicar(publicado)
    await carroDeTeste({ modelo: 'Prisma' }) // rascunho

    const slugs = await slugsPublicados()
    expect(slugs).toHaveLength(1)
  })
})
