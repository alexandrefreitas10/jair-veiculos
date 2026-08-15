import { SITE, linkWhatsapp } from '@/lib/config-site'

export const metadata = {
  title: 'Contato',
  description: `Fale direto com ${SITE.nome}, em ${SITE.cidade}.`,
}

export default function Contato() {
  return (
    <>
      <p className="kicker m-0">Contato</p>
      <h1 className="mt-2">Você fala comigo, não com um atendente.</h1>

      <p className="text-[15px]">
        Não tenho equipe de vendas nem plantão de fim de semana. Quem responde é a mesma pessoa que
        escolheu o carro, negociou a compra e conferiu a documentação.
      </p>

      <div className="card mt-8">
        <h2 className="card-title m-0">WhatsApp</h2>
        <p className="m-0 text-[13px] text-muted">O caminho mais rápido.</p>
        <a
          href={linkWhatsapp('Olá! Vim pelo site.')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-block"
        >
          Abrir conversa
        </a>
      </div>

      {SITE.instagram && (
        <div className="card mt-4">
          <h2 className="card-title m-0">Instagram</h2>
          <p className="m-0 text-[13px] text-muted">
            Os carros que chegam aparecem por lá antes de entrar no site.
          </p>
          <a
            href={`https://instagram.com/${SITE.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-block"
          >
            {SITE.instagram}
          </a>
        </div>
      )}

      <div className="card mt-4">
        <h2 className="card-title m-0">Onde estou</h2>
        <p className="m-0 text-[13px] text-muted">
          {SITE.cidade} · {SITE.estado}. Atendimento com hora marcada — me chame antes de vir, pra eu
          garantir que o carro está aqui e lavado.
        </p>
      </div>
    </>
  )
}
