import sql, { initSchema } from '@/lib/db'
import { calcularLucro } from '@/lib/lucro'
import { dataBrasilia, primeiroDiaDoMes, ultimoDiaDoMes, ultimosMeses } from '@/lib/periodo'
import type { Origem } from '@/lib/veiculos-tipos'

// Os números do painel e dos relatórios.
//
// Decisão que vale explicar: as somas são feitas em TypeScript, sobre as linhas
// trazidas do banco, e não com SUM() no SQL. O motivo não é preguiça — é que a
// regra de lucro (consignado ganha comissão, próprio ganha venda menos compra
// menos custos) já existe em `calcularLucro`. Reescrevê-la em SQL criaria uma
// segunda definição de lucro no sistema, e no dia em que uma mudasse a outra
// ficaria para trás, em silêncio, mentindo num relatório.
//
// O custo dessa escolha é trazer as linhas de venda do período para a memória.
// Com 2 a 5 vendas por mês, são dezenas de linhas por ano. Se um dia forem
// dezenas de milhares, aí vale mover para o banco — com um teste que compare
// os dois caminhos antes de trocar.

export type LinhaVenda = {
  negocioId: number
  veiculoId: number
  data: string
  marca: string
  modelo: string
  versao: string | null
  anoModelo: number
  origem: Origem
  valorCompraCentavos: number | null
  custosCentavos: number
  valorVendaCentavos: number
  comissaoRecebidaCentavos: number | null
  receita: number
  custoTotal: number
  lucro: number
  margem: number | null
  diasEmEstoque: number | null
}

type LinhaBanco = {
  negocio_id: number
  veiculo_id: number
  data: Date | string
  marca: string
  modelo: string
  versao: string | null
  ano_modelo: number
  origem: Origem
  valor_compra_centavos: number | null
  custos_centavos: string
  valor_venda_centavos: number
  comissao_recebida_centavos: number | null
  dias_em_estoque: number | null
}

function paraLinhaVenda(l: LinhaBanco): LinhaVenda {
  const custos = Number(l.custos_centavos)
  const calculo = calcularLucro({
    origem: l.origem,
    valorCompraCentavos: l.valor_compra_centavos,
    custosCentavos: [custos],
    valorVendaCentavos: l.valor_venda_centavos,
    comissaoRecebidaCentavos: l.comissao_recebida_centavos,
  })

  return {
    negocioId: l.negocio_id,
    veiculoId: l.veiculo_id,
    data: typeof l.data === 'string' ? l.data.slice(0, 10) : l.data.toISOString().slice(0, 10),
    marca: l.marca,
    modelo: l.modelo,
    versao: l.versao,
    anoModelo: l.ano_modelo,
    origem: l.origem,
    valorCompraCentavos: l.valor_compra_centavos,
    custosCentavos: custos,
    valorVendaCentavos: l.valor_venda_centavos,
    comissaoRecebidaCentavos: l.comissao_recebida_centavos,
    receita: calculo.receita,
    custoTotal: calculo.custoTotal,
    lucro: calculo.lucro,
    margem: calculo.margem,
    diasEmEstoque: l.dias_em_estoque,
  }
}

/** Vendas de um intervalo (datas no formato 'AAAA-MM-DD', ambas inclusive). */
export async function vendasNoPeriodo(de: string, ate: string): Promise<LinhaVenda[]> {
  await initSchema()
  const linhas = await sql<LinhaBanco[]>`
    SELECT
      n.id AS negocio_id, v.id AS veiculo_id, n.data,
      v.marca, v.modelo, v.versao, v.ano_modelo, v.origem,
      v.valor_compra_centavos, n.valor_venda_centavos, n.comissao_recebida_centavos,
      (n.data - v.data_entrada) AS dias_em_estoque,
      COALESCE((SELECT SUM(c.valor_centavos) FROM veiculo_custos c WHERE c.veiculo_id = v.id), 0)::text
        AS custos_centavos
    FROM negocios n
    JOIN veiculos v ON v.id = n.veiculo_id
    WHERE n.data >= ${de} AND n.data <= ${ate}
    ORDER BY n.data DESC, n.id DESC
  `
  return linhas.map(paraLinhaVenda)
}

export type Resumo = {
  vendas: number
  /** Quanto de dinheiro passou pelas mãos dele, incluindo carro dos outros. */
  volumeVendido: number
  /** O que é DELE: venda no carro próprio, comissão no consignado. */
  receita: number
  lucro: number
  /** Percentual do lucro sobre a receita. `null` quando não houve receita. */
  margemMedia: number | null
  /** Lucro médio por carro vendido. `null` quando não houve venda. */
  lucroMedio: number | null
  /** Dias médios entre entrada no estoque e venda. */
  giroMedioDias: number | null
}

export function resumir(vendas: LinhaVenda[]): Resumo {
  if (vendas.length === 0) {
    // Mês sem venda devolve zeros. Erro ou `null` aqui obrigaria toda tela a
    // tratar o caso, e mês parado é normal em quem vende 2 a 5 carros.
    return {
      vendas: 0,
      volumeVendido: 0,
      receita: 0,
      lucro: 0,
      margemMedia: null,
      lucroMedio: null,
      giroMedioDias: null,
    }
  }

  const volumeVendido = vendas.reduce((t, v) => t + v.valorVendaCentavos, 0)
  const receita = vendas.reduce((t, v) => t + v.receita, 0)
  const lucro = vendas.reduce((t, v) => t + v.lucro, 0)

  const comGiro = vendas.filter((v) => v.diasEmEstoque !== null)
  const giroMedioDias =
    comGiro.length > 0
      ? Math.round(comGiro.reduce((t, v) => t + (v.diasEmEstoque ?? 0), 0) / comGiro.length)
      : null

  return {
    vendas: vendas.length,
    volumeVendido,
    receita,
    lucro,
    margemMedia: receita === 0 ? null : (lucro / receita) * 100,
    lucroMedio: Math.round(lucro / vendas.length),
    giroMedioDias,
  }
}

export async function resumoDoMes(ano: number, mes: number): Promise<Resumo> {
  const vendas = await vendasNoPeriodo(primeiroDiaDoMes(ano, mes), ultimoDiaDoMes(ano, mes))
  return resumir(vendas)
}

export type Estoque = {
  quantidade: number
  /** Compra + custos dos carros próprios parados. É o dinheiro dele preso. */
  capitalParado: number
  /** Soma dos preços anunciados, incluindo consignados. */
  valorAnunciado: number
  /** Quantos são de terceiros — não é dinheiro dele parado. */
  consignados: number
}

export async function resumoEstoque(): Promise<Estoque> {
  await initSchema()
  const [l] = await sql<{
    quantidade: string
    capital_parado: string
    valor_anunciado: string
    consignados: string
  }[]>`
    SELECT
      COUNT(*)::text AS quantidade,
      COALESCE(SUM(
        CASE WHEN v.origem = 'proprio'
          THEN COALESCE(v.valor_compra_centavos, 0)
             + COALESCE((SELECT SUM(c.valor_centavos) FROM veiculo_custos c WHERE c.veiculo_id = v.id), 0)
          ELSE 0
        END
      ), 0)::text AS capital_parado,
      COALESCE(SUM(v.preco_centavos), 0)::text AS valor_anunciado,
      COUNT(*) FILTER (WHERE v.origem = 'consignado')::text AS consignados
    FROM veiculos v
    WHERE v.estado IN ('rascunho', 'disponivel', 'reservado')
  `
  return {
    quantidade: Number(l?.quantidade ?? 0),
    capitalParado: Number(l?.capital_parado ?? 0),
    valorAnunciado: Number(l?.valor_anunciado ?? 0),
    consignados: Number(l?.consignados ?? 0),
  }
}

export type PontoMensal = {
  chave: string
  rotulo: string
  vendas: number
  receita: number
  lucro: number
}

/** Série para o gráfico do painel. Inclui os meses sem venda de propósito: um
 *  buraco no gráfico diz tanto quanto uma barra alta. */
export async function serieMensal(quantidadeMeses = 12): Promise<PontoMensal[]> {
  const meses = ultimosMeses(quantidadeMeses)
  const de = primeiroDiaDoMes(meses[0].ano, meses[0].mes)
  const ate = ultimoDiaDoMes(meses[meses.length - 1].ano, meses[meses.length - 1].mes)

  const vendas = await vendasNoPeriodo(de, ate)

  return meses.map((m) => {
    const doMes = vendas.filter((v) => v.data.startsWith(m.chave))
    const r = resumir(doMes)
    return { chave: m.chave, rotulo: m.rotulo, vendas: r.vendas, receita: r.receita, lucro: r.lucro }
  })
}

export type CarroParado = {
  veiculoId: number
  slug: string
  marca: string
  modelo: string
  anoModelo: number
  estado: string
  diasParado: number
  precoCentavos: number
  capitalCentavos: number
}

/** Os carros que estão há mais tempo no estoque.
 *
 *  É o número que mais dói em quem revende: carro parado é dinheiro preso que
 *  não vira outro negócio, e ainda desvaloriza com o tempo. */
export async function carrosParados(limite = 5): Promise<CarroParado[]> {
  await initSchema()
  const hoje = dataBrasilia()
  const linhas = await sql<{
    id: number
    slug: string
    marca: string
    modelo: string
    ano_modelo: number
    estado: string
    dias_parado: number
    preco_centavos: number
    capital_centavos: string
  }[]>`
    SELECT
      v.id, v.slug, v.marca, v.modelo, v.ano_modelo, v.estado, v.preco_centavos,
      (${hoje}::date - v.data_entrada) AS dias_parado,
      (COALESCE(v.valor_compra_centavos, 0)
        + COALESCE((SELECT SUM(c.valor_centavos) FROM veiculo_custos c WHERE c.veiculo_id = v.id), 0)
      )::text AS capital_centavos
    FROM veiculos v
    WHERE v.estado IN ('disponivel', 'reservado')
    ORDER BY v.data_entrada ASC
    LIMIT ${limite}
  `
  return linhas.map((l) => ({
    veiculoId: l.id,
    slug: l.slug,
    marca: l.marca,
    modelo: l.modelo,
    anoModelo: l.ano_modelo,
    estado: l.estado,
    diasParado: l.dias_parado,
    precoCentavos: l.preco_centavos,
    capitalCentavos: Number(l.capital_centavos),
  }))
}

export type LinhaLivro = {
  veiculoId: number
  marca: string
  modelo: string
  versao: string | null
  anoFabricacao: number
  anoModelo: number
  finalPlaca: string | null
  origem: Origem
  estado: string
  dataEntrada: string
  compraCentavos: number | null
  despesasCentavos: number
  custoCentavos: number
  /** `null` enquanto não vendeu — na tabela vira travessão, não zero. */
  vendaCentavos: number | null
  lucroCentavos: number | null
  /** Percentual do lucro sobre o custo. */
  lucroPercentual: number | null
  /** Dias entre a entrada e a venda; se não vendeu, até hoje. */
  dias: number
  vendido: boolean
}

/**
 * O livro do pátio: um veículo por linha, com o dinheiro todo.
 *
 * `custo = compra + despesas` e `lucro = venda − custo`, exatamente como o
 * handoff especifica. Para consignado o lucro sai da comissão — a conta mora em
 * `calcularLucro` e não é reescrita aqui, senão passariam a existir duas
 * definições de lucro no sistema e uma delas ficaria para trás em silêncio.
 */
export async function livroDoPatio(): Promise<LinhaLivro[]> {
  await initSchema()
  const hoje = dataBrasilia()

  const linhas = await sql<
    {
      id: number
      marca: string
      modelo: string
      versao: string | null
      ano_fabricacao: number
      ano_modelo: number
      final_placa: string | null
      origem: Origem
      estado: string
      data_entrada: Date | string
      valor_compra_centavos: number | null
      despesas: string
      valor_venda_centavos: number | null
      comissao_recebida_centavos: number | null
      dias: number
    }[]
  >`
    SELECT
      v.id, v.marca, v.modelo, v.versao, v.ano_fabricacao, v.ano_modelo,
      v.final_placa, v.origem, v.estado, v.data_entrada, v.valor_compra_centavos,
      COALESCE((SELECT SUM(c.valor_centavos) FROM veiculo_custos c WHERE c.veiculo_id = v.id), 0)::text
        AS despesas,
      n.valor_venda_centavos, n.comissao_recebida_centavos,
      (COALESCE(n.data, ${hoje}::date) - v.data_entrada) AS dias
    FROM veiculos v
    LEFT JOIN negocios n ON n.veiculo_id = v.id
    WHERE v.estado <> 'arquivado'
    ORDER BY v.data_entrada DESC, v.id DESC
  `

  return linhas.map((l) => {
    const despesas = Number(l.despesas)
    const vendido = l.valor_venda_centavos !== null

    const calculo = calcularLucro({
      origem: l.origem,
      valorCompraCentavos: l.valor_compra_centavos,
      custosCentavos: [despesas],
      valorVendaCentavos: l.valor_venda_centavos ?? 0,
      comissaoRecebidaCentavos: l.comissao_recebida_centavos,
    })

    return {
      veiculoId: l.id,
      marca: l.marca,
      modelo: l.modelo,
      versao: l.versao,
      anoFabricacao: l.ano_fabricacao,
      anoModelo: l.ano_modelo,
      finalPlaca: l.final_placa,
      origem: l.origem,
      estado: l.estado,
      dataEntrada:
        typeof l.data_entrada === 'string'
          ? l.data_entrada.slice(0, 10)
          : l.data_entrada.toISOString().slice(0, 10),
      compraCentavos: l.valor_compra_centavos,
      despesasCentavos: despesas,
      custoCentavos: calculo.custoTotal,
      vendaCentavos: l.valor_venda_centavos,
      lucroCentavos: vendido ? calculo.lucro : null,
      lucroPercentual:
        vendido && calculo.custoTotal > 0 ? (calculo.lucro / calculo.custoTotal) * 100 : null,
      dias: l.dias,
      vendido,
    }
  })
}

/** Acima de ~90 dias parado, o carro entra em revisão de preço.
 *
 *  Regra sugerida pelo handoff e útil de verdade: carro parado é dinheiro preso
 *  que não vira outro negócio, e ainda desvaloriza sozinho com o tempo. */
export function precisaRevisarPreco(linha: LinhaLivro): boolean {
  return !linha.vendido && linha.dias > 90
}

/** CSV do relatório, para abrir no Excel.
 *
 *  Separador ponto e vírgula e BOM no começo: é o que faz o Excel em português
 *  abrir o arquivo já em colunas e com acento certo. Com vírgula e sem BOM, o
 *  Jair abre e vê tudo espremido numa coluna só, com "SÃ£o" no lugar de "São". */
export function paraCsv(vendas: LinhaVenda[]): string {
  const cabecalho = [
    'Data', 'Veículo', 'Ano', 'Origem', 'Compra', 'Custos', 'Venda',
    'Comissão', 'Receita', 'Lucro', 'Margem %', 'Dias em estoque',
  ]

  const emReais = (centavos: number | null) =>
    centavos === null ? '' : (centavos / 100).toFixed(2).replace('.', ',')

  const linhas = vendas.map((v) =>
    [
      v.data.split('-').reverse().join('/'),
      `${v.marca} ${v.modelo}${v.versao ? ' ' + v.versao : ''}`,
      String(v.anoModelo),
      v.origem === 'proprio' ? 'Próprio' : 'Consignado',
      emReais(v.valorCompraCentavos),
      emReais(v.custosCentavos),
      emReais(v.valorVendaCentavos),
      emReais(v.comissaoRecebidaCentavos),
      emReais(v.receita),
      emReais(v.lucro),
      v.margem === null ? '' : v.margem.toFixed(1).replace('.', ','),
      v.diasEmEstoque === null ? '' : String(v.diasEmEstoque),
    ]
      .map((celula) => (celula.includes(';') || celula.includes('"') ? `"${celula.replace(/"/g, '""')}"` : celula))
      .join(';'),
  )

  return '﻿' + [cabecalho.join(';'), ...linhas].join('\r\n')
}
