import { exigirSessao } from '@/lib/sessao'
import { paraCsv, vendasNoPeriodo } from '@/lib/financeiro'

// Download do relatório.
//
// Rota de API é alcançável direto pela URL — o proxy redireciona a navegação,
// mas quem chamar isto de fora do navegador não passa por ele. Por isso a
// sessão é exigida aqui dentro, igual às ações de servidor. Sem essa linha,
// bastaria conhecer o endereço pra baixar o histórico financeiro inteiro.
export async function GET(pedido: Request) {
  await exigirSessao()

  const url = new URL(pedido.url)
  const de = url.searchParams.get('de') ?? ''
  const ate = url.searchParams.get('ate') ?? ''

  const dataValida = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)
  if (!dataValida(de) || !dataValida(ate)) {
    return new Response('Período inválido', { status: 400 })
  }

  const csv = paraCsv(await vendasNoPeriodo(de, ate))

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vendas-${de}-a-${ate}.csv"`,
      // Relatório financeiro não fica em cache de proxy nenhum.
      'Cache-Control': 'no-store',
    },
  })
}
