import { SITE, linkWhatsapp } from '@/lib/config-site'

export const metadata = {
  title: 'Vender meu carro',
  description: 'Quero comprar o seu carro, ou aceitá-lo na troca por um do estoque.',
}

export default function Vender() {
  return (
    <>
      <p className="kicker m-0">Vender meu carro</p>
      <h1 className="mt-2">Compro o seu carro — ou aceito na troca.</h1>

      <p className="text-[15px]">
        Se você quer se desfazer do carro, tem dois caminhos: eu compro direto, ou ele entra como
        parte do pagamento de um do estoque.
      </p>

      <h2 className="mt-8 !text-[25px]">O que preciso saber</h2>
      <ul className="text-[15px]">
        <li>Marca, modelo, versão e ano</li>
        <li>Quilometragem</li>
        <li>Se está com IPVA e licenciamento em dia</li>
        <li>Se já teve sinistro ou passagem por leilão</li>
        <li>Algumas fotos, se puder</li>
      </ul>

      <p className="text-[15px]">
        Com isso eu já consigo te dar um valor de referência. A avaliação final é presencial, porque
        estado de conservação não aparece em foto.
      </p>

      <div className="card mt-8">
        <h2 className="card-title m-0">Me manda os dados</h2>
        <p className="m-0 text-[13px] text-muted">
          Pode mandar tudo de uma vez pelo WhatsApp — respondo com um valor de referência.
        </p>
        <a
          href={linkWhatsapp(
            'Olá! Quero vender meu carro.\nModelo:\nAno:\nKm:\nIPVA e licenciamento em dia:',
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-block"
        >
          Falar com {SITE.nome.split(' ')[0]}
        </a>
      </div>
    </>
  )
}
