// Datas em horário de Brasília.
//
// O erro que isto evita: o servidor do Render roda em UTC. Uma venda que o Jair
// registra às 22h de uma terça é, em UTC, 01h de quarta. Gravada com
// `new Date()` numa coluna DATE, ela vira quarta-feira — e some do fechamento
// da terça. No fim do mês, as vendas da noite do dia 31 aparecem no mês
// seguinte, e o número que ele confere não bate com o que ele viveu.
//
// A correção é na GRAVAÇÃO, não no filtro: as colunas de data do sistema são
// DATE (dia do calendário, sem hora). Uma vez gravado o dia certo, comparar
// data com data não tem fuso nenhum envolvido.
//
// O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo
// em −3. Se voltar, este é o arquivo a mudar — e só ele.

const DESLOCAMENTO_BRASILIA_MS = 3 * 60 * 60 * 1000

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** O dia do calendário em Brasília, no formato que o Postgres entende. */
export function dataBrasilia(instante: Date = new Date()): string {
  const emBrasilia = new Date(instante.getTime() - DESLOCAMENTO_BRASILIA_MS)
  return emBrasilia.toISOString().slice(0, 10)
}

/** Aceita o que vier — texto do campo de data do formulário ou objeto Date —
 *  e devolve sempre o dia do calendário em Brasília. */
export function normalizarData(data: string | Date): string {
  if (typeof data === 'string') return data.slice(0, 10)
  return dataBrasilia(data)
}

export function mesAtualBrasilia(instante: Date = new Date()): { ano: number; mes: number } {
  const [ano, mes] = dataBrasilia(instante).split('-').map(Number)
  return { ano, mes }
}

/** '2026-08-01' */
export function primeiroDiaDoMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

/** '2026-08-31' — conta os dias do mês, inclusive fevereiro bissexto. */
export function ultimoDiaDoMes(ano: number, mes: number): string {
  const dias = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dias).padStart(2, '0')}`
}

/** Os últimos N meses, do mais antigo para o mais recente. Alimenta o gráfico
 *  do painel — e inclui os meses sem venda, que também dizem alguma coisa. */
export function ultimosMeses(
  quantidade: number,
  instante: Date = new Date(),
): Array<{ ano: number; mes: number; rotulo: string; chave: string }> {
  const { ano, mes } = mesAtualBrasilia(instante)
  const lista: Array<{ ano: number; mes: number; rotulo: string; chave: string }> = []

  for (let i = quantidade - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ano, mes - 1 - i, 1))
    const a = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    lista.push({
      ano: a,
      mes: m,
      rotulo: MESES_CURTOS[m - 1],
      chave: `${a}-${String(m).padStart(2, '0')}`,
    })
  }
  return lista
}

/** Data do banco (ou texto) para '14/08/2026'. */
export function formatarData(data: Date | string | null | undefined): string {
  if (!data) return '—'
  const texto = typeof data === 'string' ? data.slice(0, 10) : data.toISOString().slice(0, 10)
  const [ano, mes, dia] = texto.split('-')
  if (!ano || !mes || !dia) return '—'
  return `${dia}/${mes}/${ano}`
}

/** '14 de agosto de 2026' */
export function formatarDataPorExtenso(data: Date | string | null | undefined): string {
  if (!data) return '—'
  const texto = typeof data === 'string' ? data.slice(0, 10) : data.toISOString().slice(0, 10)
  const [ano, mes, dia] = texto.split('-').map(Number)
  if (!ano || !mes || !dia) return '—'
  return `${dia} de ${MESES[mes - 1]} de ${ano}`
}
