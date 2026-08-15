import Link from 'next/link'
import { urlFoto } from '@/lib/armazenamento'
import { formatarKm, formatarReaisCurto } from '@/lib/dinheiro'
import { SITE } from '@/lib/config-site'
import { parcelaAPartirDe } from '@/lib/financiamento'
import { ROTULO_CARROCERIA } from '@/lib/veiculos-tipos'
import type { CarroVitrine } from '@/lib/vitrine'

// Card do handoff. O cartão INTEIRO é o link; o botão "Ver detalhes" é
// decoração com `pointer-events: none`. Botão dentro de link seria um alvo
// aninhado — o navegador aceita, mas o leitor de tela anuncia dois destinos e
// o toque no celular fica ambíguo.

export function CardCarro({ carro }: { carro: CarroVitrine }) {
  const foto = urlFoto(carro.fotoCapaMiniatura ?? carro.fotoCapa)
  const titulo = `${carro.marca} ${carro.modelo}${carro.versao ? ` ${carro.versao}` : ''}`
  const parcela = SITE.financiamento.ativo ? parcelaAPartirDe(carro.precoCentavos) : null

  return (
    <Link
      href={`/carros/${carro.slug}`}
      className="card card-link overflow-hidden !p-0 text-text no-underline"
    >
      <div className="plate !border-0 aspect-4/3 border-b border-[var(--color-divider)]">
        {foto ? (
          <img src={foto} alt={titulo} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-[11px] text-muted">sem foto</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="card-kicker">{carro.marca}</span>
          {carro.finalPlaca && (
            <span className="jj-num text-[11px] text-muted">final {carro.finalPlaca}</span>
          )}
        </div>

        <h3 className="card-title !text-[19px]">
          {carro.modelo}
          {carro.versao && <span className="font-normal"> {carro.versao}</span>}
        </h3>

        <p className="jj-num m-0 text-[12px] text-muted">
          {carro.anoFabricacao}/{carro.anoModelo} · {formatarKm(carro.km)}
          {carro.carroceria && (
            <span className="font-sans"> · {ROTULO_CARROCERIA[carro.carroceria]}</span>
          )}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {carro.estado === 'reservado' && <span className="tag tag-outline">Reservado</span>}
          <span className="tag tag-neutral">{carro.cor}</span>
        </div>

        <hr className="hr !my-1" />

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="jj-num m-0 font-heading text-[26px] leading-none font-semibold tracking-[-0.02em]">
              {formatarReaisCurto(carro.precoCentavos)}
            </p>
            {parcela !== null && parcela > 0 && (
              <p className="jj-num m-0 mt-1 text-[11px] text-muted">
                ou {formatarReaisCurto(parcela)}/mês
              </p>
            )}
          </div>
          <span className="btn btn-primary pointer-events-none">Ver detalhes</span>
        </div>
      </div>
    </Link>
  )
}
