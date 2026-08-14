import Link from 'next/link'
import { FormularioVeiculo } from '@/components/admin/FormularioVeiculo'
import { criarVeiculoAcao } from '../acoes'

export const metadata = { title: 'Novo veículo' }

export default function NovoVeiculo() {
  return (
    <>
      <nav className="mb-4 text-sm text-grafite-500">
        <Link href="/admin/veiculos" className="transition hover:text-grafite-300">
          Veículos
        </Link>
        <span className="mx-2 text-grafite-700">/</span>
        <span className="text-grafite-300">Novo</span>
      </nav>

      <h1 className="font-display text-2xl font-bold tracking-tight text-grafite-50">Novo veículo</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-grafite-400">
        O carro é salvo como rascunho. As fotos entram na próxima tela, e ele só vai pro site quando
        você mandar publicar — assim ninguém vê o cadastro pela metade.
      </p>

      <div className="mt-6 max-w-4xl">
        <FormularioVeiculo acao={criarVeiculoAcao} rotuloBotao="Salvar e adicionar fotos" />
      </div>
    </>
  )
}
