import { randomBytes } from 'node:crypto'
import sql, { initSchema } from '@/lib/db'
import { armazenamento } from '@/lib/armazenamento'
import { processarFoto } from '@/lib/imagem'

export type Foto = {
  id: number
  veiculoId: number
  chave: string
  chaveMiniatura: string | null
  largura: number | null
  altura: number | null
  ordem: number
  capa: boolean
}

type Linha = {
  id: number
  veiculo_id: number
  chave: string
  chave_miniatura: string | null
  largura: number | null
  altura: number | null
  ordem: number
  capa: boolean
}

const paraFoto = (l: Linha): Foto => ({
  id: l.id,
  veiculoId: l.veiculo_id,
  chave: l.chave,
  chaveMiniatura: l.chave_miniatura,
  largura: l.largura,
  altura: l.altura,
  ordem: l.ordem,
  capa: l.capa,
})

export async function listarFotos(veiculoId: number): Promise<Foto[]> {
  await initSchema()
  const linhas = await sql<Linha[]>`
    SELECT id, veiculo_id, chave, chave_miniatura, largura, altura, ordem, capa
    FROM veiculo_fotos WHERE veiculo_id = ${veiculoId}
    ORDER BY capa DESC, ordem ASC, id ASC
  `
  return linhas.map(paraFoto)
}

/**
 * Processa e guarda uma foto.
 *
 * A primeira foto de um veículo vira capa automaticamente. Sem isso, o Jair
 * cadastra o carro, esquece de marcar a capa, e o anúncio vai pro ar com um
 * retângulo cinza no lugar da foto principal.
 */
export async function adicionarFoto(veiculoId: number, original: Buffer): Promise<Foto> {
  await initSchema()

  const { grande, miniatura, largura, altura } = await processarFoto(original)

  const nome = randomBytes(8).toString('hex')
  const chave = `veiculos/${veiculoId}/${nome}.webp`
  const chaveMiniatura = `veiculos/${veiculoId}/${nome}-mini.webp`

  const arm = armazenamento()
  await arm.salvar(chave, grande, 'image/webp')
  await arm.salvar(chaveMiniatura, miniatura, 'image/webp')

  const [{ total }] = await sql<{ total: string }[]>`
    SELECT COUNT(*)::text AS total FROM veiculo_fotos WHERE veiculo_id = ${veiculoId}
  `
  const quantidade = Number(total)

  const [linha] = await sql<Linha[]>`
    INSERT INTO veiculo_fotos (veiculo_id, chave, chave_miniatura, largura, altura, ordem, capa)
    VALUES (${veiculoId}, ${chave}, ${chaveMiniatura}, ${largura}, ${altura}, ${quantidade}, ${quantidade === 0})
    RETURNING id, veiculo_id, chave, chave_miniatura, largura, altura, ordem, capa
  `
  return paraFoto(linha)
}

/**
 * Remove a foto do banco e do armazenamento.
 *
 * Se a removida era a capa, a próxima assume. Sem essa promoção, o carro fica
 * sem capa e some da listagem visualmente — o cartão aparece vazio, o que é
 * pior do que não aparecer.
 */
export async function removerFoto(fotoId: number): Promise<void> {
  await initSchema()

  const [foto] = await sql<Linha[]>`
    SELECT id, veiculo_id, chave, chave_miniatura, largura, altura, ordem, capa
    FROM veiculo_fotos WHERE id = ${fotoId}
  `
  if (!foto) return

  await sql`DELETE FROM veiculo_fotos WHERE id = ${fotoId}`

  if (foto.capa) {
    const [proxima] = await sql<{ id: number }[]>`
      SELECT id FROM veiculo_fotos WHERE veiculo_id = ${foto.veiculo_id}
      ORDER BY ordem ASC, id ASC LIMIT 1
    `
    if (proxima) {
      await sql`UPDATE veiculo_fotos SET capa = TRUE WHERE id = ${proxima.id}`
    }
  }

  // O arquivo sai por último e sem derrubar a operação: o registro do banco é
  // a fonte da verdade. Um arquivo órfão no armazenamento custa centavos; uma
  // linha órfã no banco vira foto quebrada na tela do cliente.
  const arm = armazenamento()
  await arm.apagar(foto.chave).catch(() => {})
  if (foto.chave_miniatura) await arm.apagar(foto.chave_miniatura).catch(() => {})
}

/** Troca a capa. O índice parcial do banco garante que só existe uma. */
export async function definirCapa(veiculoId: number, fotoId: number): Promise<void> {
  await initSchema()
  await sql.begin(async (tx) => {
    // Tira a atual ANTES de pôr a nova: o índice único parcial recusaria duas
    // capas ao mesmo tempo, e a operação inteira falharia.
    await tx`UPDATE veiculo_fotos SET capa = FALSE WHERE veiculo_id = ${veiculoId} AND capa`
    await tx`UPDATE veiculo_fotos SET capa = TRUE WHERE id = ${fotoId} AND veiculo_id = ${veiculoId}`
  })
}

/** Reordena conforme a lista de identificadores recebida. */
export async function reordenarFotos(veiculoId: number, idsNaOrdem: number[]): Promise<void> {
  await initSchema()
  await sql.begin(async (tx) => {
    for (let i = 0; i < idsNaOrdem.length; i++) {
      await tx`
        UPDATE veiculo_fotos SET ordem = ${i}
        WHERE id = ${idsNaOrdem[i]} AND veiculo_id = ${veiculoId}
      `
    }
  })
}

export async function contarFotos(veiculoId: number): Promise<number> {
  await initSchema()
  const [l] = await sql<{ total: string }[]>`
    SELECT COUNT(*)::text AS total FROM veiculo_fotos WHERE veiculo_id = ${veiculoId}
  `
  return Number(l?.total ?? 0)
}
