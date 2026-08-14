import sql, { initSchema } from '@/lib/db'
import { dataBrasilia, normalizarData } from '@/lib/periodo'
import type { CategoriaCusto } from '@/lib/veiculos-tipos'

// Tudo que o Jair põe DENTRO do carro depois de adquirir: funilaria, mecânica,
// documentação, pneus. É o que separa o lucro de verdade da diferença ingênua
// entre o que ele pagou e o que ele vendeu.

export type Custo = {
  id: number
  veiculoId: number
  data: Date
  categoria: CategoriaCusto
  descricao: string | null
  valorCentavos: number
}

type Linha = {
  id: number
  veiculo_id: number
  data: Date
  categoria: string
  descricao: string | null
  valor_centavos: number
}

const paraCusto = (l: Linha): Custo => ({
  id: l.id,
  veiculoId: l.veiculo_id,
  data: l.data,
  categoria: l.categoria as CategoriaCusto,
  descricao: l.descricao,
  valorCentavos: l.valor_centavos,
})

export async function lancarCusto(dados: {
  veiculoId: number
  categoria: CategoriaCusto
  valorCentavos: number
  descricao?: string | null
  data?: string | Date
}): Promise<Custo> {
  await initSchema()
  const [linha] = await sql<Linha[]>`
    INSERT INTO veiculo_custos (veiculo_id, data, categoria, descricao, valor_centavos)
    VALUES (
      ${dados.veiculoId},
      ${dados.data ? normalizarData(dados.data) : dataBrasilia()},
      ${dados.categoria},
      ${dados.descricao ?? null},
      ${dados.valorCentavos}
    )
    RETURNING id, veiculo_id, data, categoria, descricao, valor_centavos
  `
  return paraCusto(linha)
}

export async function listarCustos(veiculoId: number): Promise<Custo[]> {
  await initSchema()
  const linhas = await sql<Linha[]>`
    SELECT id, veiculo_id, data, categoria, descricao, valor_centavos
    FROM veiculo_custos WHERE veiculo_id = ${veiculoId}
    ORDER BY data ASC, id ASC
  `
  return linhas.map(paraCusto)
}

export async function removerCusto(id: number): Promise<void> {
  await initSchema()
  await sql`DELETE FROM veiculo_custos WHERE id = ${id}`
}

/** Soma dos custos de um veículo. Carro sem custo lançado devolve 0. */
export async function totalCustos(veiculoId: number): Promise<number> {
  await initSchema()
  const [l] = await sql<{ total: string }[]>`
    SELECT COALESCE(SUM(valor_centavos), 0)::text AS total
    FROM veiculo_custos WHERE veiculo_id = ${veiculoId}
  `
  return Number(l?.total ?? 0)
}

/** Total de custos de vários veículos de uma vez.
 *
 *  Existe para o relatório não fazer uma consulta por carro: com trinta carros
 *  vendidos, a versão ingênua seriam trinta idas ao banco só pra montar uma
 *  tabela. */
export async function custosPorVeiculo(ids: number[]): Promise<Map<number, number>> {
  await initSchema()
  const mapa = new Map<number, number>()
  if (ids.length === 0) return mapa

  const linhas = await sql<{ veiculo_id: number; total: string }[]>`
    SELECT veiculo_id, COALESCE(SUM(valor_centavos), 0)::text AS total
    FROM veiculo_custos WHERE veiculo_id = ANY(${ids})
    GROUP BY veiculo_id
  `
  for (const l of linhas) mapa.set(l.veiculo_id, Number(l.total))
  return mapa
}
