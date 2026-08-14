import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import sql, { initSchema } from '@/lib/db'
import { criarVeiculo } from '@/lib/veiculos'
import { adicionarFoto, removerFoto, definirCapa, listarFotos, reordenarFotos } from '@/lib/fotos'
import { processarFoto } from '@/lib/imagem'

const rodar = process.env.DATABASE_URL ? describe : describe.skip

/** Foto falsa, mas de verdade: o sharp precisa de bytes de imagem reais. */
async function fotoFalsa(largura = 3000, altura = 2000): Promise<Buffer> {
  return sharp({
    create: { width: largura, height: altura, channels: 3, background: { r: 120, g: 130, b: 140 } },
  })
    .jpeg()
    .toBuffer()
}

async function carro() {
  return criarVeiculo({
    marca: 'Fiat',
    modelo: 'Argo',
    anoFabricacao: 2020,
    anoModelo: 2021,
    cambio: 'manual',
    combustivel: 'flex',
    cor: 'Branco',
  })
}

afterAll(async () => {
  await rm(resolve(process.cwd(), '.uploads/veiculos'), { recursive: true, force: true })
})

describe('processarFoto', () => {
  test('encolhe foto de celular e converte pra WebP', async () => {
    const original = await fotoFalsa(3000, 2000)
    const r = await processarFoto(original)

    expect(r.largura).toBe(1600) // não passa de 1600, senão não abre no 4G
    expect(r.altura).toBe(1067)

    const meta = await sharp(r.grande).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(1600)

    const metaMini = await sharp(r.miniatura).metadata()
    expect(metaMini.width).toBe(400)
  })

  test('a versão da listagem é bem mais leve que a do anúncio', async () => {
    const r = await processarFoto(await fotoFalsa())
    expect(r.miniatura.length).toBeLessThan(r.grande.length)
  })

  test('foto pequena não é esticada', async () => {
    const r = await processarFoto(await fotoFalsa(300, 200))
    expect(r.largura).toBe(300)
  })

  test('arquivo que não é imagem é recusado', async () => {
    await expect(processarFoto(Buffer.from('isto nao e uma imagem'))).rejects.toThrow()
  })
})

rodar('fotos do veículo', () => {
  beforeAll(async () => {
    await initSchema()
  })

  beforeEach(async () => {
    await sql`DELETE FROM negocios`
    await sql`DELETE FROM veiculos`
  })

  test('a primeira foto vira capa sozinha', async () => {
    // Se dependesse do Jair marcar, o anúncio iria pro ar com um retângulo
    // cinza no lugar da foto principal.
    const id = await carro()
    const foto = await adicionarFoto(id, await fotoFalsa())
    expect(foto.capa).toBe(true)
  })

  test('a segunda foto não rouba a capa', async () => {
    const id = await carro()
    await adicionarFoto(id, await fotoFalsa())
    const segunda = await adicionarFoto(id, await fotoFalsa())
    expect(segunda.capa).toBe(false)
  })

  test('um veículo nunca fica com duas capas', async () => {
    const id = await carro()
    const a = await adicionarFoto(id, await fotoFalsa())
    const b = await adicionarFoto(id, await fotoFalsa())
    await definirCapa(id, b.id)

    const fotos = await listarFotos(id)
    expect(fotos.filter((f) => f.capa)).toHaveLength(1)
    expect(fotos.find((f) => f.capa)!.id).toBe(b.id)
    expect(fotos.find((f) => f.id === a.id)!.capa).toBe(false)
  })

  test('apagar a capa promove a próxima foto', async () => {
    const id = await carro()
    const capa = await adicionarFoto(id, await fotoFalsa())
    const outra = await adicionarFoto(id, await fotoFalsa())

    await removerFoto(capa.id)

    const fotos = await listarFotos(id)
    expect(fotos).toHaveLength(1)
    expect(fotos[0].id).toBe(outra.id)
    expect(fotos[0].capa).toBe(true) // o carro não pode ficar sem capa
  })

  test('apagar a última foto não estoura', async () => {
    const id = await carro()
    const unica = await adicionarFoto(id, await fotoFalsa())
    await removerFoto(unica.id)
    expect(await listarFotos(id)).toHaveLength(0)
  })

  test('apagar foto que não existe é silencioso', async () => {
    await expect(removerFoto(999_999)).resolves.toBeUndefined()
  })

  test('reordenar respeita a lista recebida', async () => {
    const id = await carro()
    const a = await adicionarFoto(id, await fotoFalsa())
    const b = await adicionarFoto(id, await fotoFalsa())
    const c = await adicionarFoto(id, await fotoFalsa())

    await reordenarFotos(id, [c.id, b.id, a.id])

    // A capa continua primeiro na listagem; a ordem vale para o resto.
    const fotos = await listarFotos(id)
    const semCapa = fotos.filter((f) => !f.capa).map((f) => f.id)
    expect(semCapa).toEqual([c.id, b.id])
  })

  test('apagar o veículo leva as fotos junto', async () => {
    const id = await carro()
    await adicionarFoto(id, await fotoFalsa())
    await sql`DELETE FROM veiculos WHERE id = ${id}`
    expect(await listarFotos(id)).toHaveLength(0)
  })
})
