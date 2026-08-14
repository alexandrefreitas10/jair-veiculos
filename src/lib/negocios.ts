import sql, { initSchema } from '@/lib/db'
import { gerarSlug } from '@/lib/slug'
import { calcularLucro } from '@/lib/lucro'
import { dataBrasilia, normalizarData } from '@/lib/periodo'
import type { Cambio, Carroceria, Combustivel, FormaPagamento, Origem } from '@/lib/veiculos-tipos'

// A VENDA.
//
// Uma operação, três coisas acontecendo juntas: registra o negócio, marca o
// carro como vendido (tirando ele da vitrine) e, se houve troca, cria o carro
// que entrou. As três numa transação só — meia venda registrada é pior do que
// venda nenhuma, porque o Jair acha que está lançado e não confere.

export type DadosEntradaTroca = {
  marca: string
  modelo: string
  versao?: string | null
  anoFabricacao: number
  anoModelo: number
  km?: number
  cambio: Cambio
  combustivel: Combustivel
  cor: string
  carroceria?: Carroceria | null
  /** Por quanto o carro foi aceito na negociação. Vira o custo de aquisição. */
  valorAvaliadoCentavos: number
}

export type DadosNegocio = {
  veiculoId: number
  valorVendaCentavos: number
  data?: string | Date
  compradorNome?: string | null
  compradorContato?: string | null
  formaPagamento?: FormaPagamento | null
  /** Só em consignado: quanto o Jair recebeu de comissão. */
  comissaoRecebidaCentavos?: number | null
  /** Preenchido quando entrou um carro como parte do pagamento. */
  entrada?: DadosEntradaTroca | null
  observacoes?: string | null
}

export type Negocio = {
  id: number
  veiculoId: number
  data: Date
  compradorNome: string | null
  compradorContato: string | null
  valorVendaCentavos: number
  formaPagamento: FormaPagamento | null
  comissaoRecebidaCentavos: number | null
  veiculoEntradaId: number | null
  valorAvaliadoEntradaCentavos: number | null
  observacoes: string | null
  /** Calculado na hora do registro, a partir da origem, compra e custos. */
  receita: number
  custoTotal: number
  lucro: number
  margem: number | null
}

type LinhaNegocio = {
  id: number
  veiculo_id: number
  data: Date
  comprador_nome: string | null
  comprador_contato: string | null
  valor_venda_centavos: number
  forma_pagamento: string | null
  comissao_recebida_centavos: number | null
  veiculo_entrada_id: number | null
  valor_avaliado_entrada_centavos: number | null
  observacoes: string | null
}

/**
 * Registra a venda.
 *
 * Sobre a troca: o carro que entra NÃO é abatido do lucro desta venda. Ele
 * vira estoque, com custo de aquisição igual ao valor pelo qual foi aceito.
 * Descontar o valor avaliado aqui contaria o mesmo dinheiro duas vezes — uma
 * como desconto na venda, outra como custo do próximo negócio — e o Jair
 * fecharia o mês achando que lucrou menos do que lucrou.
 */
export async function registrarNegocio(dados: DadosNegocio): Promise<Negocio> {
  await initSchema()

  return sql.begin(async (tx) => {
    const [veiculo] = await tx<
      { id: number; origem: Origem; valor_compra_centavos: number | null; estado: string }[]
    >`
      SELECT id, origem, valor_compra_centavos, estado
      FROM veiculos WHERE id = ${dados.veiculoId}
      FOR UPDATE
    `
    if (!veiculo) throw new Error(`Veículo ${dados.veiculoId} não encontrado.`)
    if (veiculo.estado === 'vendido') {
      throw new Error('Este veículo já foi vendido. Cancele o negócio anterior antes de registrar outro.')
    }

    // Carro que entrou na troca, se houve. Nasce em rascunho: o Jair ainda vai
    // fotografar e completar o anúncio antes de pôr no ar.
    let veiculoEntradaId: number | null = null
    if (dados.entrada) {
      const e = dados.entrada
      const slug = gerarSlug({ marca: e.marca, modelo: e.modelo, versao: e.versao, anoModelo: e.anoModelo })
      const [novo] = await tx<{ id: number }[]>`
        INSERT INTO veiculos (
          slug, marca, modelo, versao, ano_fabricacao, ano_modelo, km, cambio,
          combustivel, cor, carroceria, origem, valor_compra_centavos,
          data_entrada, estado, observacoes_internas
        ) VALUES (
          ${slug}, ${e.marca}, ${e.modelo}, ${e.versao ?? null},
          ${e.anoFabricacao}, ${e.anoModelo}, ${e.km ?? 0}, ${e.cambio},
          ${e.combustivel}, ${e.cor}, ${e.carroceria ?? null},
          'proprio', ${e.valorAvaliadoCentavos},
          ${dados.data ? normalizarData(dados.data) : dataBrasilia()},
          'rascunho',
          ${'Entrou na troca do negócio do veículo #' + dados.veiculoId}
        )
        RETURNING id
      `
      veiculoEntradaId = novo.id
    }

    const [linha] = await tx<LinhaNegocio[]>`
      INSERT INTO negocios (
        veiculo_id, data, comprador_nome, comprador_contato, valor_venda_centavos,
        forma_pagamento, comissao_recebida_centavos, veiculo_entrada_id,
        valor_avaliado_entrada_centavos, observacoes
      ) VALUES (
        ${dados.veiculoId},
        ${dados.data ? normalizarData(dados.data) : dataBrasilia()},
        ${dados.compradorNome ?? null}, ${dados.compradorContato ?? null},
        ${dados.valorVendaCentavos}, ${dados.formaPagamento ?? null},
        ${dados.comissaoRecebidaCentavos ?? null}, ${veiculoEntradaId},
        ${dados.entrada?.valorAvaliadoCentavos ?? null}, ${dados.observacoes ?? null}
      )
      RETURNING *
    `

    // Uma ação só: registrar a venda tira o carro da vitrine. Se dependesse de
    // o Jair lembrar de mudar o estado depois, carro vendido continuaria
    // anunciado e ele receberia contato que não pode atender.
    await tx`UPDATE veiculos SET estado = 'vendido', atualizado_em = NOW() WHERE id = ${dados.veiculoId}`

    const custos = await tx<{ total: string }[]>`
      SELECT COALESCE(SUM(valor_centavos), 0)::text AS total
      FROM veiculo_custos WHERE veiculo_id = ${dados.veiculoId}
    `

    return montarNegocio(linha, veiculo.origem, veiculo.valor_compra_centavos, Number(custos[0].total))
  })
}

function montarNegocio(
  l: LinhaNegocio,
  origem: Origem,
  valorCompraCentavos: number | null,
  custosTotais: number,
): Negocio {
  const calculo = calcularLucro({
    origem,
    valorCompraCentavos,
    custosCentavos: [custosTotais],
    valorVendaCentavos: l.valor_venda_centavos,
    comissaoRecebidaCentavos: l.comissao_recebida_centavos,
  })

  return {
    id: l.id,
    veiculoId: l.veiculo_id,
    data: l.data,
    compradorNome: l.comprador_nome,
    compradorContato: l.comprador_contato,
    valorVendaCentavos: l.valor_venda_centavos,
    formaPagamento: (l.forma_pagamento as FormaPagamento) ?? null,
    comissaoRecebidaCentavos: l.comissao_recebida_centavos,
    veiculoEntradaId: l.veiculo_entrada_id,
    valorAvaliadoEntradaCentavos: l.valor_avaliado_entrada_centavos,
    observacoes: l.observacoes,
    receita: calculo.receita,
    custoTotal: calculo.custoTotal,
    lucro: calculo.lucro,
    margem: calculo.margem,
  }
}

/** Negócio com os dados do carro junto — é assim que a tela sempre precisa. */
export type NegocioComVeiculo = Negocio & {
  marca: string
  modelo: string
  versao: string | null
  anoModelo: number
  origem: Origem
  diasEmEstoque: number | null
}

const CONSULTA_NEGOCIOS = sql`
  SELECT
    n.*, v.marca, v.modelo, v.versao, v.ano_modelo, v.origem,
    v.valor_compra_centavos,
    (n.data - v.data_entrada) AS dias_em_estoque,
    COALESCE((SELECT SUM(c.valor_centavos) FROM veiculo_custos c WHERE c.veiculo_id = v.id), 0) AS custos_totais
  FROM negocios n
  JOIN veiculos v ON v.id = n.veiculo_id
`

type LinhaCompleta = LinhaNegocio & {
  marca: string
  modelo: string
  versao: string | null
  ano_modelo: number
  origem: Origem
  valor_compra_centavos: number | null
  dias_em_estoque: number | null
  custos_totais: string | number
}

function paraNegocioComVeiculo(l: LinhaCompleta): NegocioComVeiculo {
  return {
    ...montarNegocio(l, l.origem, l.valor_compra_centavos, Number(l.custos_totais)),
    marca: l.marca,
    modelo: l.modelo,
    versao: l.versao,
    anoModelo: l.ano_modelo,
    origem: l.origem,
    diasEmEstoque: l.dias_em_estoque,
  }
}

export async function listarNegocios(): Promise<NegocioComVeiculo[]> {
  await initSchema()
  const linhas = await sql<LinhaCompleta[]>`${CONSULTA_NEGOCIOS} ORDER BY n.data DESC, n.id DESC`
  return linhas.map(paraNegocioComVeiculo)
}

export async function buscarNegocio(id: number): Promise<NegocioComVeiculo | null> {
  await initSchema()
  const [l] = await sql<LinhaCompleta[]>`${CONSULTA_NEGOCIOS} WHERE n.id = ${id}`
  return l ? paraNegocioComVeiculo(l) : null
}

export async function buscarNegocioDoVeiculo(veiculoId: number): Promise<NegocioComVeiculo | null> {
  await initSchema()
  const [l] = await sql<LinhaCompleta[]>`${CONSULTA_NEGOCIOS} WHERE n.veiculo_id = ${veiculoId}`
  return l ? paraNegocioComVeiculo(l) : null
}

/**
 * Desfaz a venda e devolve o carro pra vitrine.
 *
 * O carro que entrou numa troca NÃO é apagado junto, de propósito: quando o
 * Jair percebe o erro, ele já pode ter fotografado e anunciado esse carro.
 * Apagar levaria junto trabalho de verdade. Ele apaga à mão se for o caso.
 */
export async function cancelarNegocio(id: number): Promise<void> {
  await initSchema()
  await sql.begin(async (tx) => {
    const [negocio] = await tx<{ veiculo_id: number }[]>`
      SELECT veiculo_id FROM negocios WHERE id = ${id}
    `
    if (!negocio) return
    await tx`DELETE FROM negocios WHERE id = ${id}`
    await tx`UPDATE veiculos SET estado = 'disponivel', atualizado_em = NOW() WHERE id = ${negocio.veiculo_id}`
  })
}
