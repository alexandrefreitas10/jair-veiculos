'use client'

import { useCallback, useEffect, useState } from 'react'

// As URLs chegam prontas do servidor, e não resolvidas aqui.
//
// Não é preferência de estilo: `urlFoto` mora em `armazenamento.ts`, que
// importa `node:fs` para o driver de disco. Importado num componente de
// cliente, isso quebra a compilação — o navegador não tem sistema de arquivos.
// Passar texto pronto mantém a decisão de onde a foto está guardada inteira no
// servidor, que é onde ela pertence.
type FotoAnuncio = { grande: string; miniatura: string }

export function Galeria({ fotos, titulo }: { fotos: FotoAnuncio[]; titulo: string }) {
  const [atual, setAtual] = useState(0)

  const anterior = useCallback(() => {
    setAtual((i) => (i === 0 ? fotos.length - 1 : i - 1))
  }, [fotos.length])

  const proxima = useCallback(() => {
    setAtual((i) => (i === fotos.length - 1 ? 0 : i + 1))
  }, [fotos.length])

  // Setas do teclado. Quem olha carro no computador navega assim sem pensar,
  // e é de graça implementar.
  useEffect(() => {
    if (fotos.length < 2) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') anterior()
      if (e.key === 'ArrowRight') proxima()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [anterior, proxima, fotos.length])

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-xl border border-grafite-800 bg-grafite-900">
        <span className="etiqueta">sem fotos</span>
      </div>
    )
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-grafite-800 bg-grafite-900">
        <div className="aspect-4/3">
          <img
            src={fotos[atual].grande}
            alt={`${titulo} — foto ${atual + 1} de ${fotos.length}`}
            className="h-full w-full object-cover"
            // A primeira foto é o que segura o cliente na página; as outras
            // só carregam quando ele pedir.
            loading={atual === 0 ? 'eager' : 'lazy'}
          />
        </div>

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-grafite-950/70 text-grafite-100 backdrop-blur transition hover:bg-grafite-950"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-grafite-950/70 text-grafite-100 backdrop-blur transition hover:bg-grafite-950"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="m8.6 16.6 1.4 1.4 6-6-6-6-1.4 1.4 4.6 4.6z" />
              </svg>
            </button>

            <span className="numero absolute bottom-3 right-3 rounded-md bg-grafite-950/80 px-2.5 py-1 text-xs text-grafite-200 backdrop-blur">
              {atual + 1}/{fotos.length}
            </span>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        // Rolagem horizontal com encaixe: no celular o dedo arrasta a tira e
        // ela para alinhada na miniatura.
        <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <button
              key={f.grande}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === atual}
              className={`h-16 w-24 shrink-0 snap-start overflow-hidden rounded-lg border transition ${
                i === atual
                  ? 'border-ambar-500 opacity-100'
                  : 'border-grafite-800 opacity-55 hover:opacity-100'
              }`}
            >
              <img
                src={f.miniatura}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
