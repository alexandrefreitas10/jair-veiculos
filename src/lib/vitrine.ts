import sql, { initSchema } from '@/lib/db'
import { ESTADOS_PUBLICOS } from '@/lib/veiculos-tipos'
import type { Cambio, Carroceria, Combustivel, Estado } from '@/lib/veiculos-tipos'

// ─────────────────────────────────────────────────────────────────────────────
// A VITRINE PÚBLICA. Este arquivo é a única porta por onde dado de veículo sai
// sem sessão.
//
// Duas regras que não se afrouxam:
//
// 1. NENHUM `SELECT *`. As colunas são listadas uma a uma. Um `SELECT *` faria
//    com que a próxima coluna privada criada no banco — um valor de compra, um
//    nome de consignante — passasse a sair na API pública no mesmo dia, sem
//    ninguém perceber.
// 2. O mapeamento para o objeto de saída é escrito à mão. Conversão automática
//    de snake_case para camelCase é cômoda e é exatamente o que transformaria
//    uma coluna nova em campo público de graça.
//
// O teste `__tests__/lib/vitrine.test.ts` serializa o resultado e procura por
// nome e por VALOR dos campos privados. Ele vale mais que este comentário.
// ─────────────────────────────────────────────────────────────────────────────

/** O carro como o comprador vê na listagem. */
export type CarroVitrine = {
  id: number
  slug: string
  marca: string
  modelo: string
  versao: string | null
  anoFabricacao: number
  anoModelo: number
  km: number
  cambio: Cambio
  combustivel: Combustivel
  cor: string
  precoCentavos: number
  estado: Extract<Estado, 'disponivel' | 'reservado'>
  /** Chave da foto de capa no armazenamento. A URL é montada na exibição. */
  fotoCapa: string | null
  fotoCapaMiniatura: string | null
}

/** O carro como o comprador vê na página do anúncio: tudo da listagem, mais a
 *  ficha completa, os selos e as fotos. */
export type Anuncio = CarroVitrine & {
  portas: number
  carroceria: Carroceria | null
  finalPlaca: string | null
  opcionais: string[]
  aceitaTroca: boolean
  descricao: string | null
  selos: {
    ipvaPago: boolean
    licenciamentoOk: boolean
    semMultas: boolean
    semDebitos: boolean
    laudoCautelarOk: boolean
    unicoDono: boolean
    chaveReserva: boolean
    manual: boolean
    revisoesEmDia: boolean
  }
  fotos: Array<{ chave: string; miniatura: string | null }>
}

export type Filtros = {
  busca?: string
  marca?: string
  modelo?: string
  precoMin?: number
  precoMax?: number
  anoMin?: number
  kmMax?: number
  cambio?: Cambio
  combustivel?: Combustivel
  ordem?: 'recente' | 'preco_asc' | 'preco_desc' | 'km_asc'
  limite?: number
}

// Subconsulta da foto de capa. Se ninguém marcou capa, cai na primeira da
// ordem — carro sem foto nenhuma na listagem afugenta o comprador, e "o Jair
// esqueceu de marcar a capa" não é motivo pra isso acontecer.
const CAPA = sql`
  (SELECT f.chave FROM veiculo_fotos f
    WHERE f.veiculo_id = v.id ORDER BY f.capa DESC, f.ordem ASC, f.id ASC LIMIT 1) AS foto_capa,
  (SELECT f.chave_miniatura FROM veiculo_fotos f
    WHERE f.veiculo_id = v.id ORDER BY f.capa DESC, f.ordem ASC, f.id ASC LIMIT 1) AS foto_capa_miniatura
`

type LinhaVitrine = Record<string, unknown>

function paraCarro(l: LinhaVitrine): CarroVitrine {
  return {
    id: l.id as number,
    slug: l.slug as string,
    marca: l.marca as string,
    modelo: l.modelo as string,
    versao: (l.versao as string) ?? null,
    anoFabricacao: l.ano_fabricacao as number,
    anoModelo: l.ano_modelo as number,
    km: l.km as number,
    cambio: l.cambio as Cambio,
    combustivel: l.combustivel as Combustivel,
    cor: l.cor as string,
    precoCentavos: l.preco_centavos as number,
    estado: l.estado as CarroVitrine['estado'],
    fotoCapa: (l.foto_capa as string) ?? null,
    fotoCapaMiniatura: (l.foto_capa_miniatura as string) ?? null,
  }
}

export async function listarVitrine(filtros: Filtros): Promise<CarroVitrine[]> {
  await initSchema()

  // O filtro de estado vive AQUI dentro, não no parâmetro. Se fosse parâmetro,
  // uma chamada distraída passando `estado: 'rascunho'` publicaria carro que o
  // Jair ainda está montando.
  let onde = sql`WHERE v.estado = ANY(${ESTADOS_PUBLICOS})`

  if (filtros.marca) onde = sql`${onde} AND v.marca = ${filtros.marca}`
  if (filtros.modelo) onde = sql`${onde} AND v.modelo = ${filtros.modelo}`
  if (filtros.precoMin !== undefined) onde = sql`${onde} AND v.preco_centavos >= ${filtros.precoMin}`
  if (filtros.precoMax !== undefined) onde = sql`${onde} AND v.preco_centavos <= ${filtros.precoMax}`
  if (filtros.anoMin !== undefined) onde = sql`${onde} AND v.ano_modelo >= ${filtros.anoMin}`
  if (filtros.kmMax !== undefined) onde = sql`${onde} AND v.km <= ${filtros.kmMax}`
  if (filtros.cambio) onde = sql`${onde} AND v.cambio = ${filtros.cambio}`
  if (filtros.combustivel) onde = sql`${onde} AND v.combustivel = ${filtros.combustivel}`
  if (filtros.busca) {
    const termo = `%${filtros.busca}%`
    onde = sql`${onde} AND (v.marca ILIKE ${termo} OR v.modelo ILIKE ${termo} OR v.versao ILIKE ${termo})`
  }

  // Lista fixa de ordenações: o valor vem da URL e nunca entra na consulta
  // como texto.
  const ordenacao =
    filtros.ordem === 'preco_asc'
      ? sql`ORDER BY v.preco_centavos ASC`
      : filtros.ordem === 'preco_desc'
        ? sql`ORDER BY v.preco_centavos DESC`
        : filtros.ordem === 'km_asc'
          ? sql`ORDER BY v.km ASC`
          : sql`ORDER BY v.criado_em DESC`

  const limite = filtros.limite ?? 60

  const linhas = await sql<LinhaVitrine[]>`
    SELECT
      v.id, v.slug, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
      v.km, v.cambio, v.combustivel, v.cor, v.preco_centavos, v.estado,
      ${CAPA}
    FROM veiculos v
    ${onde}
    ${ordenacao}
    LIMIT ${limite}
  `
  return linhas.map(paraCarro)
}

export async function listarDestaques(limite = 6): Promise<CarroVitrine[]> {
  await initSchema()
  const linhas = await sql<LinhaVitrine[]>`
    SELECT
      v.id, v.slug, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
      v.km, v.cambio, v.combustivel, v.cor, v.preco_centavos, v.estado,
      ${CAPA}
    FROM veiculos v
    WHERE v.estado = ANY(${ESTADOS_PUBLICOS}) AND v.destaque
    ORDER BY v.criado_em DESC
    LIMIT ${limite}
  `
  return linhas.map(paraCarro)
}

export async function buscarAnuncio(slug: string): Promise<Anuncio | null> {
  await initSchema()
  const [l] = await sql<LinhaVitrine[]>`
    SELECT
      v.id, v.slug, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
      v.km, v.cambio, v.combustivel, v.cor, v.preco_centavos, v.estado,
      v.portas, v.carroceria, v.final_placa, v.opcionais, v.aceita_troca, v.descricao,
      v.ipva_pago, v.licenciamento_ok, v.sem_multas, v.sem_debitos,
      v.laudo_cautelar_ok, v.unico_dono, v.chave_reserva, v.manual, v.revisoes_em_dia,
      ${CAPA}
    FROM veiculos v
    WHERE v.slug = ${slug} AND v.estado = ANY(${ESTADOS_PUBLICOS})
  `
  if (!l) return null

  const fotos = await sql<{ chave: string; chave_miniatura: string | null }[]>`
    SELECT chave, chave_miniatura FROM veiculo_fotos
    WHERE veiculo_id = ${l.id as number}
    ORDER BY capa DESC, ordem ASC, id ASC
  `

  return {
    ...paraCarro(l),
    portas: l.portas as number,
    carroceria: (l.carroceria as Carroceria) ?? null,
    finalPlaca: (l.final_placa as string) ?? null,
    opcionais: (l.opcionais as string[]) ?? [],
    aceitaTroca: l.aceita_troca as boolean,
    descricao: (l.descricao as string) ?? null,
    selos: {
      ipvaPago: l.ipva_pago as boolean,
      licenciamentoOk: l.licenciamento_ok as boolean,
      semMultas: l.sem_multas as boolean,
      semDebitos: l.sem_debitos as boolean,
      laudoCautelarOk: l.laudo_cautelar_ok as boolean,
      unicoDono: l.unico_dono as boolean,
      chaveReserva: l.chave_reserva as boolean,
      manual: l.manual as boolean,
      revisoesEmDia: l.revisoes_em_dia as boolean,
    },
    fotos: fotos.map((f) => ({ chave: f.chave, miniatura: f.chave_miniatura })),
  }
}

/** Marcas com pelo menos um carro no ar — alimenta o filtro sem oferecer
 *  marca que não tem resultado nenhum. */
export async function marcasNaVitrine(): Promise<string[]> {
  await initSchema()
  const linhas = await sql<{ marca: string }[]>`
    SELECT DISTINCT marca FROM veiculos
    WHERE estado = ANY(${ESTADOS_PUBLICOS})
    ORDER BY marca
  `
  return linhas.map((l) => l.marca)
}

/** Para o sitemap: só o que está no ar. Mandar rascunho pro Google seria
 *  publicar carro pela metade. */
export async function slugsPublicados(): Promise<Array<{ slug: string; atualizadoEm: Date }>> {
  await initSchema()
  const linhas = await sql<{ slug: string; atualizado_em: Date }[]>`
    SELECT slug, atualizado_em FROM veiculos
    WHERE estado = ANY(${ESTADOS_PUBLICOS})
    ORDER BY atualizado_em DESC
  `
  return linhas.map((l) => ({ slug: l.slug, atualizadoEm: l.atualizado_em }))
}

/** Quantos carros estão no ar. Usado na home. */
export async function totalNaVitrine(): Promise<number> {
  await initSchema()
  const [l] = await sql<{ total: string }[]>`
    SELECT COUNT(*)::text AS total FROM veiculos WHERE estado = ANY(${ESTADOS_PUBLICOS})
  `
  return Number(l?.total ?? 0)
}
