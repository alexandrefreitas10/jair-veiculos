'use client'

import { useState } from 'react'

// As URLs chegam prontas do servidor, não resolvidas aqui: `urlFoto` mora em
// `armazenamento.ts`, que importa `node:fs` para o driver de disco. Importado
// num componente de cliente isso quebra a compilação — o navegador não tem
// sistema de arquivos.
type FotoAnuncio = { grande: string; miniatura: string }

export function Galeria({ fotos, titulo }: { fotos: FotoAnuncio[]; titulo: string }) {
  const [atual, setAtual] = useState(0)

  if (fotos.length === 0) {
    return (
      <div className="plate flex aspect-16/10 items-center justify-center">
        <span className="text-[11px] text-muted">foto principal</span>
      </div>
    )
  }

  return (
    <div>
      <div className="plate aspect-16/10">
        <img
          src={fotos[atual].grande}
          alt={`${titulo} — foto ${atual + 1} de ${fotos.length}`}
          loading={atual === 0 ? 'eager' : 'lazy'}
          className="h-full w-full object-cover"
        />
      </div>

      {fotos.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {fotos.slice(0, 8).map((f, i) => (
            <button
              key={f.grande}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === atual}
              // O mat da miniatura é mais fino que o da foto principal (4px vs
              // 6px), como no handoff — mantém a proporção visual da moldura.
              className="plate aspect-4/3 !border-4 cursor-pointer p-0"
              style={i === atual ? { outlineColor: 'var(--color-accent)', outlineWidth: '2px' } : undefined}
            >
              <img src={f.miniatura} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
