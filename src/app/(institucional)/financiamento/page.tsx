import Link from 'next/link'
import { SITE, linkWhatsapp } from '@/lib/config-site'

export const metadata = {
  title: 'Financiamento',
  description: 'Como funciona o financiamento na compra do seu carro.',
}

export default function Financiamento() {
  return (
    <>
      <p className="kicker m-0">Financiamento</p>
      <h1 className="mt-2">Dá pra financiar — e eu ajudo com a papelada.</h1>

      <p className="text-[15px]">
        A simulação que aparece em cada anúncio usa a tabela Price, o mesmo cálculo que os bancos
        usam. Ela serve para você ter uma ideia da parcela antes de conversar.
      </p>

      <p className="text-[15px]">
        O valor final depende da análise de crédito do banco, do seu perfil e da entrada que você
        conseguir dar. Nenhuma simulação vale como aprovação.
      </p>

      <h2 className="mt-8 !text-[25px]">Como costuma funcionar</h2>
      <ul className="text-[15px]">
        <li>Você escolhe o carro e a gente conversa sobre entrada e prazo.</li>
        <li>Levo sua proposta aos bancos com que trabalho.</li>
        <li>Saindo a aprovação, cuido da transferência e da documentação.</li>
      </ul>

      <div className="card mt-8">
        <h2 className="card-title m-0">Quer simular com um carro específico?</h2>
        <p className="m-0 text-[13px] text-muted">
          Abra o anúncio: o simulador fica ao lado do preço, e dá pra mexer na entrada e no prazo.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/" className="btn btn-primary">
            Ver o estoque
          </Link>
          <a
            href={linkWhatsapp('Olá! Queria entender as condições de financiamento.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Falar com {SITE.nome.split(' ')[0]}
          </a>
        </div>
      </div>
    </>
  )
}
