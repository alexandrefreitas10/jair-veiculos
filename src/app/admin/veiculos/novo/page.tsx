import Link from 'next/link'
import { EntradaDeVeiculo } from '@/components/admin/EntradaDeVeiculo'
import { criarVeiculoAcao } from '../acoes'

export const metadata = { title: 'Entrada de veículo' }

export default function NovoVeiculo() {
  return (
    <>
      <nav className="mb-3 text-[13px] text-muted">
        <Link href="/admin/veiculos" className="text-muted no-underline hover:text-accent">
          Estoque
        </Link>
        <span className="mx-2">/</span>
        <span>Entrada de veículo</span>
      </nav>

      <p className="kicker m-0">Entrada no pátio</p>
      <h1 className="titulo-pagina mt-2">O que entrou, quanto custou, por quanto sai.</h1>
      <p className="mt-1 max-w-[52ch] text-[14px] text-muted">
        O carro é salvo como rascunho. As fotos entram na tela seguinte, e ele só vai pro site
        quando você mandar publicar — assim ninguém vê o cadastro pela metade.
      </p>

      <div className="mt-6">
        <EntradaDeVeiculo acao={criarVeiculoAcao} />
      </div>
    </>
  )
}
