import { somar } from '@/lib/dinheiro'
import type { Origem } from '@/lib/veiculos-tipos'

export type EntradaLucro = {
  origem: Origem
  /** Só existe em carro próprio. */
  valorCompraCentavos: number | null
  /** Tudo que o Jair gastou no carro depois de adquirir. */
  custosCentavos: number[]
  valorVendaCentavos: number
  /** Só existe em consignado. */
  comissaoRecebidaCentavos: number | null
}

export type ResultadoLucro = {
  /** O que efetivamente entrou no bolso DELE. */
  receita: number
  custoTotal: number
  lucro: number
  /** Percentual sobre a receita. `null` quando não há receita para dividir. */
  margem: number | null
}

/**
 * Lucro de um negócio, nos dois tipos de origem.
 *
 * A distinção que sustenta o módulo inteiro: em carro CONSIGNADO, o valor da
 * venda não é dinheiro do Jair — é do dono do carro. A receita dele é só a
 * comissão. Tratar a venda como receita faria o faturamento parecer dez ou
 * vinte vezes maior, e um número desses leva a decisão errada (achar que pode
 * comprar mais estoque do que pode).
 *
 * Função pura, sem banco: dá pra testar todos os casos sem subir Postgres.
 */
export function calcularLucro(entrada: EntradaLucro): ResultadoLucro {
  const custosExtras = somar(entrada.custosCentavos)

  if (entrada.origem === 'consignado') {
    // O carro não é dele: não há valor de compra. Ele pode ter bancado alguma
    // coisa (lavagem, um documento) e isso sai da comissão.
    const receita = entrada.comissaoRecebidaCentavos ?? 0
    const lucro = receita - custosExtras
    return { receita, custoTotal: custosExtras, lucro, margem: calcularMargem(lucro, receita) }
  }

  // Carro próprio. Compra ausente é tratada como zero — acontece com o carro
  // que entrou numa troca antes do cadastro ser completado, e o relatório
  // precisa continuar de pé em vez de estourar.
  const custoTotal = (entrada.valorCompraCentavos ?? 0) + custosExtras
  const receita = entrada.valorVendaCentavos
  const lucro = receita - custoTotal
  return { receita, custoTotal, lucro, margem: calcularMargem(lucro, receita) }
}

/** `null` em vez de NaN ou zero: sem receita não existe margem para mostrar,
 *  e "0%" mentiria dizendo que o negócio foi ruim. */
function calcularMargem(lucro: number, receita: number): number | null {
  if (receita === 0) return null
  return (lucro / receita) * 100
}
