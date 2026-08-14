import sql, { initSchema } from '@/lib/db'
import { gerarSlug } from '@/lib/slug'
import { dataBrasilia, normalizarData } from '@/lib/periodo'
import type { Cambio, Carroceria, Combustivel, Estado, Origem } from '@/lib/veiculos-tipos'

// Camada PRIVADA do veículo: enxerga tudo, inclusive quanto o Jair pagou e de
// quem é o carro consignado. Toda função daqui só pode ser chamada de dentro do
// painel, atrás de sessão. A vitrine pública usa `src/lib/vitrine.ts`, que é
// um arquivo separado justamente para que essa fronteira seja visível.

export type Veiculo = {
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
  portas: number
  carroceria: Carroceria | null
  finalPlaca: string | null
  opcionais: string[]
  precoCentavos: number
  aceitaTroca: boolean
  descricao: string | null
  destaque: boolean

  ipvaPago: boolean
  licenciamentoOk: boolean
  semMultas: boolean
  semDebitos: boolean
  laudoCautelarOk: boolean
  unicoDono: boolean
  chaveReserva: boolean
  manual: boolean
  revisoesEmDia: boolean

  // ── privado ──────────────────────────────────────────────────────────────
  origem: Origem
  valorCompraCentavos: number | null
  consignanteNome: string | null
  consignanteContato: string | null
  comissaoTipo: 'percentual' | 'fixo' | null
  comissaoPercentualBps: number | null
  comissaoFixaCentavos: number | null
  dataEntrada: Date
  observacoesInternas: string | null

  estado: Estado
  criadoEm: Date
  atualizadoEm: Date
}

export type DadosVeiculo = {
  marca: string
  modelo: string
  versao?: string | null
  anoFabricacao: number
  anoModelo: number
  km?: number
  cambio: Cambio
  combustivel: Combustivel
  cor: string
  portas?: number
  carroceria?: Carroceria | null
  finalPlaca?: string | null
  opcionais?: string[]
  precoCentavos?: number
  aceitaTroca?: boolean
  descricao?: string | null
  destaque?: boolean

  ipvaPago?: boolean
  licenciamentoOk?: boolean
  semMultas?: boolean
  semDebitos?: boolean
  laudoCautelarOk?: boolean
  unicoDono?: boolean
  chaveReserva?: boolean
  manual?: boolean
  revisoesEmDia?: boolean

  origem?: Origem
  valorCompraCentavos?: number | null
  consignanteNome?: string | null
  consignanteContato?: string | null
  comissaoTipo?: 'percentual' | 'fixo' | null
  comissaoPercentualBps?: number | null
  comissaoFixaCentavos?: number | null
  dataEntrada?: string | Date
  observacoesInternas?: string | null

  estado?: Estado
}

type LinhaVeiculo = Record<string, unknown>

function paraVeiculo(l: LinhaVeiculo): Veiculo {
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
    portas: l.portas as number,
    carroceria: (l.carroceria as Carroceria) ?? null,
    finalPlaca: (l.final_placa as string) ?? null,
    opcionais: (l.opcionais as string[]) ?? [],
    precoCentavos: l.preco_centavos as number,
    aceitaTroca: l.aceita_troca as boolean,
    descricao: (l.descricao as string) ?? null,
    destaque: l.destaque as boolean,
    ipvaPago: l.ipva_pago as boolean,
    licenciamentoOk: l.licenciamento_ok as boolean,
    semMultas: l.sem_multas as boolean,
    semDebitos: l.sem_debitos as boolean,
    laudoCautelarOk: l.laudo_cautelar_ok as boolean,
    unicoDono: l.unico_dono as boolean,
    chaveReserva: l.chave_reserva as boolean,
    manual: l.manual as boolean,
    revisoesEmDia: l.revisoes_em_dia as boolean,
    origem: l.origem as Origem,
    valorCompraCentavos: (l.valor_compra_centavos as number) ?? null,
    consignanteNome: (l.consignante_nome as string) ?? null,
    consignanteContato: (l.consignante_contato as string) ?? null,
    comissaoTipo: (l.comissao_tipo as 'percentual' | 'fixo') ?? null,
    comissaoPercentualBps: (l.comissao_percentual_bps as number) ?? null,
    comissaoFixaCentavos: (l.comissao_fixa_centavos as number) ?? null,
    dataEntrada: l.data_entrada as Date,
    observacoesInternas: (l.observacoes_internas as string) ?? null,
    estado: l.estado as Estado,
    criadoEm: l.criado_em as Date,
    atualizadoEm: l.atualizado_em as Date,
  }
}

export async function criarVeiculo(dados: DadosVeiculo): Promise<number> {
  await initSchema()
  const slug = gerarSlug({
    marca: dados.marca,
    modelo: dados.modelo,
    versao: dados.versao,
    anoModelo: dados.anoModelo,
  })

  const [linha] = await sql<{ id: number }[]>`
    INSERT INTO veiculos (
      slug, marca, modelo, versao, ano_fabricacao, ano_modelo, km, cambio,
      combustivel, cor, portas, carroceria, final_placa, opcionais,
      preco_centavos, aceita_troca, descricao, destaque,
      ipva_pago, licenciamento_ok, sem_multas, sem_debitos, laudo_cautelar_ok,
      unico_dono, chave_reserva, manual, revisoes_em_dia,
      origem, valor_compra_centavos, consignante_nome, consignante_contato,
      comissao_tipo, comissao_percentual_bps, comissao_fixa_centavos,
      data_entrada, observacoes_internas, estado
    ) VALUES (
      ${slug}, ${dados.marca}, ${dados.modelo}, ${dados.versao ?? null},
      ${dados.anoFabricacao}, ${dados.anoModelo}, ${dados.km ?? 0}, ${dados.cambio},
      ${dados.combustivel}, ${dados.cor}, ${dados.portas ?? 4},
      ${dados.carroceria ?? null}, ${dados.finalPlaca ?? null},
      ${dados.opcionais ?? []},
      ${dados.precoCentavos ?? 0}, ${dados.aceitaTroca ?? true},
      ${dados.descricao ?? null}, ${dados.destaque ?? false},
      ${dados.ipvaPago ?? false}, ${dados.licenciamentoOk ?? false},
      ${dados.semMultas ?? false}, ${dados.semDebitos ?? false},
      ${dados.laudoCautelarOk ?? false}, ${dados.unicoDono ?? false},
      ${dados.chaveReserva ?? false}, ${dados.manual ?? false},
      ${dados.revisoesEmDia ?? false},
      ${dados.origem ?? 'proprio'}, ${dados.valorCompraCentavos ?? null},
      ${dados.consignanteNome ?? null}, ${dados.consignanteContato ?? null},
      ${dados.comissaoTipo ?? null}, ${dados.comissaoPercentualBps ?? null},
      ${dados.comissaoFixaCentavos ?? null},
      ${dados.dataEntrada ? normalizarData(dados.dataEntrada) : dataBrasilia()},
      ${dados.observacoesInternas ?? null},
      ${dados.estado ?? 'rascunho'}
    )
    RETURNING id
  `
  return linha.id
}

export async function buscarVeiculo(id: number): Promise<Veiculo | null> {
  await initSchema()
  const [linha] = await sql<LinhaVeiculo[]>`SELECT * FROM veiculos WHERE id = ${id}`
  return linha ? paraVeiculo(linha) : null
}

export async function buscarVeiculoPorSlug(slug: string): Promise<Veiculo | null> {
  await initSchema()
  const [linha] = await sql<LinhaVeiculo[]>`SELECT * FROM veiculos WHERE slug = ${slug}`
  return linha ? paraVeiculo(linha) : null
}

/** Lista para o painel: mostra TODOS os estados, inclusive rascunho e vendido. */
export async function listarVeiculos(filtros: { estado?: Estado } = {}): Promise<Veiculo[]> {
  await initSchema()
  const linhas = filtros.estado
    ? await sql<LinhaVeiculo[]>`
        SELECT * FROM veiculos WHERE estado = ${filtros.estado}
        ORDER BY criado_em DESC
      `
    : await sql<LinhaVeiculo[]>`SELECT * FROM veiculos ORDER BY criado_em DESC`
  return linhas.map(paraVeiculo)
}

/** Mapa de campo do TypeScript para coluna do banco. Só o que pode ser
 *  atualizado aparece aqui — `id`, `slug` e `criado_em` ficam de fora de
 *  propósito: mudar o slug de um carro já anunciado quebra o link que o Jair
 *  mandou no WhatsApp ontem. */
const COLUNA: Record<string, string> = {
  marca: 'marca',
  modelo: 'modelo',
  versao: 'versao',
  anoFabricacao: 'ano_fabricacao',
  anoModelo: 'ano_modelo',
  km: 'km',
  cambio: 'cambio',
  combustivel: 'combustivel',
  cor: 'cor',
  portas: 'portas',
  carroceria: 'carroceria',
  finalPlaca: 'final_placa',
  opcionais: 'opcionais',
  precoCentavos: 'preco_centavos',
  aceitaTroca: 'aceita_troca',
  descricao: 'descricao',
  destaque: 'destaque',
  ipvaPago: 'ipva_pago',
  licenciamentoOk: 'licenciamento_ok',
  semMultas: 'sem_multas',
  semDebitos: 'sem_debitos',
  laudoCautelarOk: 'laudo_cautelar_ok',
  unicoDono: 'unico_dono',
  chaveReserva: 'chave_reserva',
  manual: 'manual',
  revisoesEmDia: 'revisoes_em_dia',
  origem: 'origem',
  valorCompraCentavos: 'valor_compra_centavos',
  consignanteNome: 'consignante_nome',
  consignanteContato: 'consignante_contato',
  comissaoTipo: 'comissao_tipo',
  comissaoPercentualBps: 'comissao_percentual_bps',
  comissaoFixaCentavos: 'comissao_fixa_centavos',
  dataEntrada: 'data_entrada',
  observacoesInternas: 'observacoes_internas',
  estado: 'estado',
}

export async function atualizarVeiculo(id: number, dados: Partial<DadosVeiculo>): Promise<void> {
  await initSchema()
  const alteracoes: Record<string, unknown> = {}
  for (const [campo, valor] of Object.entries(dados)) {
    const coluna = COLUNA[campo]
    // Campo desconhecido é ignorado em silêncio de propósito: o formulário
    // manda campos de controle junto e não vale derrubar o salvamento do Jair
    // por causa deles.
    if (coluna) alteracoes[coluna] = valor
  }
  if (Object.keys(alteracoes).length === 0) return

  alteracoes.atualizado_em = new Date()
  await sql`UPDATE veiculos SET ${sql(alteracoes)} WHERE id = ${id}`
}

export async function mudarEstado(id: number, estado: Estado): Promise<void> {
  await initSchema()
  await sql`UPDATE veiculos SET estado = ${estado}, atualizado_em = NOW() WHERE id = ${id}`
}

/** Coloca no ar. Só faz sentido a partir de rascunho ou arquivado. */
export async function publicar(id: number): Promise<void> {
  await mudarEstado(id, 'disponivel')
}

export async function apagarVeiculo(id: number): Promise<void> {
  await initSchema()
  // Um veículo com negócio registrado é barrado pelo ON DELETE RESTRICT do
  // banco. É proposital: apagar o carro apagaria o histórico financeiro junto.
  await sql`DELETE FROM veiculos WHERE id = ${id}`
}

/** Marcas já cadastradas, para preencher o filtro sem digitação livre. */
export async function marcasCadastradas(): Promise<string[]> {
  await initSchema()
  const linhas = await sql<{ marca: string }[]>`
    SELECT DISTINCT marca FROM veiculos ORDER BY marca
  `
  return linhas.map((l) => l.marca)
}
