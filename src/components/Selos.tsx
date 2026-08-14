import { SELOS } from '@/lib/veiculos-tipos'
import type { Anuncio } from '@/lib/vitrine'

// Os selos de documentação. É aqui que o Jair ganha do anúncio solto de rede
// social: quem compra usado tem medo de multa herdada, de débito escondido e de
// carro batido. Dizer isso de forma direta vale mais que qualquer adjetivo na
// descrição.
//
// Nenhuma imagem de documento aparece — CRLV tem CPF, nome e endereço do dono.
// O comprador confere o papel pessoalmente, na hora de fechar.

const MAPA: Record<string, keyof Anuncio['selos']> = {
  ipva_pago: 'ipvaPago',
  licenciamento_ok: 'licenciamentoOk',
  sem_multas: 'semMultas',
  sem_debitos: 'semDebitos',
  laudo_cautelar_ok: 'laudoCautelarOk',
  unico_dono: 'unicoDono',
  revisoes_em_dia: 'revisoesEmDia',
  chave_reserva: 'chaveReserva',
  manual: 'manual',
}

export function Selos({ selos }: { selos: Anuncio['selos'] }) {
  const confirmados = SELOS.filter((s) => selos[MAPA[s.campo]])

  // Sem nenhum selo marcado, a seção inteira some. Uma lista de "não" ao lado
  // do carro afunda a venda — e a ausência de informação é honesta: o
  // comprador pergunta no WhatsApp.
  if (confirmados.length === 0) return null

  return (
    <section aria-labelledby="titulo-selos">
      <h2 id="titulo-selos" className="etiqueta mb-3">
        Documentação e procedência
      </h2>
      <ul className="flex flex-wrap gap-2">
        {confirmados.map((s) => (
          <li
            key={s.campo}
            className="flex items-center gap-1.5 rounded-lg border border-conferido/25 bg-conferido/8 px-3 py-1.5 text-sm text-conferido"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0 fill-current">
              <path d="M8.2 13.6 4.9 10.3l1.4-1.4 1.9 1.9 5-5 1.4 1.4-6.4 6.4Z" />
            </svg>
            {s.rotulo}
          </li>
        ))}
      </ul>
    </section>
  )
}
