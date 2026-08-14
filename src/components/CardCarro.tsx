import Link from 'next/link'
import { urlFoto } from '@/lib/armazenamento'
import { formatarKm, formatarReaisCurto } from '@/lib/dinheiro'
import { ROTULO_CAMBIO, ROTULO_COMBUSTIVEL } from '@/lib/veiculos-tipos'
import type { CarroVitrine } from '@/lib/vitrine'

// Nota sobre <img> em vez de next/image: as fotos já saem do `sharp` em WebP,
// em dois tamanhos, na hora do envio. Passar de novo pelo otimizador do Next
// gastaria CPU do servidor pra refazer trabalho pronto — e, com o R2 servindo
// de outro domínio, ainda exigiria liberar o domínio na configuração. Menos
// peça, mesmo resultado.

export function CardCarro({ carro, indice = 0 }: { carro: CarroVitrine; indice?: number }) {
  const foto = urlFoto(carro.fotoCapaMiniatura ?? carro.fotoCapa)
  const titulo = `${carro.marca} ${carro.modelo}${carro.versao ? ` ${carro.versao}` : ''}`

  return (
    <Link
      href={`/carros/${carro.slug}`}
      className="surgir group flex flex-col overflow-hidden rounded-xl border border-grafite-800 bg-grafite-900 transition duration-300 hover:-translate-y-1 hover:border-ambar-500/50 hover:shadow-2xl hover:shadow-black/50"
      // Escalona a entrada por posição: a página se monta de cima pra baixo
      // em vez de piscar inteira de uma vez. Trava em 8 pra última linha de
      // uma listagem longa não ficar esperando.
      style={{ animationDelay: `${Math.min(indice, 8) * 55}ms` }}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-grafite-800">
        {foto ? (
          <img
            src={foto}
            alt={titulo}
            loading={indice < 4 ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="etiqueta">sem foto</span>
          </div>
        )}

        {carro.estado === 'reservado' && (
          <span className="absolute left-3 top-3 rounded-md bg-grafite-950/90 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-widest text-ambar-300 backdrop-blur">
            Reservado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display font-semibold leading-snug text-grafite-50">
          {carro.marca} {carro.modelo}
        </h3>
        {carro.versao && <p className="mt-0.5 truncate text-sm text-grafite-400">{carro.versao}</p>}

        <p className="numero mt-3 text-xl font-semibold text-ambar-400">
          {formatarReaisCurto(carro.precoCentavos)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grafite-800 pt-3 text-xs text-grafite-400">
          <span className="numero">
            {carro.anoFabricacao}/{carro.anoModelo}
          </span>
          <span className="text-grafite-700">·</span>
          <span className="numero">{formatarKm(carro.km)}</span>
          <span className="text-grafite-700">·</span>
          <span>{ROTULO_CAMBIO[carro.cambio]}</span>
          <span className="text-grafite-700">·</span>
          <span>{ROTULO_COMBUSTIVEL[carro.combustivel]}</span>
        </div>
      </div>
    </Link>
  )
}
