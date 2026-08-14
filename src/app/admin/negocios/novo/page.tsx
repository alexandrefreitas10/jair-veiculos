import Link from 'next/link'
import { FormularioNegocio, type OpcaoVeiculo } from '@/components/admin/FormularioNegocio'
import { listarVeiculos } from '@/lib/veiculos'
import { registrarNegocioAcao } from '../acoes'

export const metadata = { title: 'Registrar venda' }

export default async function NovaVenda({
  searchParams,
}: {
  searchParams: Promise<{ veiculo?: string }>
}) {
  const { veiculo } = await searchParams
  const todos = await listarVeiculos()

  // Vendido e arquivado ficam de fora: o primeiro já tem negócio (o banco
  // recusaria outro) e o segundo saiu de circulação.
  const disponiveis: OpcaoVeiculo[] = todos
    .filter((v) => v.estado !== 'vendido' && v.estado !== 'arquivado')
    .map((v) => ({
      id: v.id,
      rotulo: `${v.marca} ${v.modelo}${v.versao ? ` ${v.versao}` : ''} ${v.anoModelo}`,
      origem: v.origem,
      precoCentavos: v.precoCentavos,
    }))

  const preSelecionado = veiculo ? Number(veiculo) : undefined

  return (
    <>
      <nav className="mb-4 text-sm text-grafite-500">
        <Link href="/admin/negocios" className="transition hover:text-grafite-300">
          Vendas
        </Link>
        <span className="mx-2 text-grafite-700">/</span>
        <span className="text-grafite-300">Nova</span>
      </nav>

      <h1 className="font-display text-2xl font-bold tracking-tight text-grafite-50">Registrar venda</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-grafite-400">
        Ao registrar, o carro sai do site e o lucro entra no painel. Se entrou carro na troca, ele é
        cadastrado no estoque na mesma hora.
      </p>

      <div className="mt-6 max-w-4xl">
        <FormularioNegocio
          veiculos={disponiveis}
          acao={registrarNegocioAcao}
          veiculoPreSelecionado={
            preSelecionado && Number.isInteger(preSelecionado) ? preSelecionado : undefined
          }
        />
      </div>
    </>
  )
}
