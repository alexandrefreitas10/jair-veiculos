'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

type Resultado = { erro: string | null; salvoEm?: number }
type Acao = (anterior: Resultado, formulario: FormData) => Promise<Resultado>

const LARGURA_MAXIMA = 1600
const QUALIDADE = 0.85

/**
 * Reduz a foto no NAVEGADOR antes de enviar.
 *
 * Motivo, descoberto da pior forma (no primeiro envio real do Jair, em
 * produção): um Server Action aceita 1 MB de corpo por padrão, e foto de
 * celular tem de 3 a 8 MB. O framework recusava a requisição antes do código
 * do servidor rodar, e o navegador mostrava a página de erro do servidor.
 *
 * Levantar o limite resolveria mal: ele seleciona várias fotos de uma vez, e
 * dez fotos de 6 MB seriam 60 MB numa requisição só, num servidor com 512 MB.
 *
 * Reduzir aqui resolve os dois lados — cada foto sai com algumas centenas de
 * KB, e o envio fica rápido no 4G do pátio, que é onde ele realmente usa isso.
 * O servidor continua processando com o sharp: é lá que a miniatura é feita e
 * o EXIF (com a coordenada de GPS) é descartado.
 */
async function reduzir(arquivo: File): Promise<File> {
  // HEIC do iPhone e formatos que o navegador não decodifica caem no catch e
  // seguem no tamanho original. Melhor enviar grande do que não enviar.
  try {
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })

    const escala = Math.min(1, LARGURA_MAXIMA / bitmap.width)
    const largura = Math.round(bitmap.width * escala)
    const altura = Math.round(bitmap.height * escala)

    const tela = document.createElement('canvas')
    tela.width = largura
    tela.height = altura
    const contexto = tela.getContext('2d')
    if (!contexto) return arquivo
    contexto.drawImage(bitmap, 0, 0, largura, altura)
    bitmap.close()

    const blob = await new Promise<Blob | null>((r) => tela.toBlob(r, 'image/webp', QUALIDADE))
    if (!blob) return arquivo

    // Se a "redução" engordou o arquivo (acontece com foto já bem comprimida e
    // pequena), fica com o original.
    if (blob.size >= arquivo.size) return arquivo

    return new File([blob], arquivo.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return arquivo
  }
}

export function EnviarFotos({ veiculoId, acao }: { veiculoId: number; acao: Acao }) {
  const entrada = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [, atualizar] = useTransition()

  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState({ feitas: 0, total: 0 })
  const [erros, setErros] = useState<string[]>([])

  async function aoEscolher(lista: FileList | null) {
    const arquivos = Array.from(lista ?? [])
    if (arquivos.length === 0) return

    setEnviando(true)
    setErros([])
    setProgresso({ feitas: 0, total: arquivos.length })

    const problemas: string[] = []

    // UMA foto por requisição, em sequência. Em lote, uma foto grande derruba
    // o envio inteiro e ele não sabe quais subiram; assim cada uma tem seu
    // próprio destino e o progresso é honesto.
    for (let i = 0; i < arquivos.length; i++) {
      try {
        const reduzida = await reduzir(arquivos[i])
        const formulario = new FormData()
        formulario.append('id', String(veiculoId))
        formulario.append('fotos', reduzida)

        const resultado = await acao({ erro: null }, formulario)
        if (resultado.erro) problemas.push(resultado.erro)
      } catch {
        problemas.push(`${arquivos[i].name}: falhou no envio.`)
      }
      setProgresso({ feitas: i + 1, total: arquivos.length })
    }

    setErros(problemas)
    setEnviando(false)
    if (entrada.current) entrada.current.value = ''
    atualizar(() => router.refresh())
  }

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => aoEscolher(e.target.files)}
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        className="btn btn-secondary w-full border-dashed py-6"
      >
        {enviando ? (
          `Enviando ${progresso.feitas} de ${progresso.total}…`
        ) : (
          <>
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            Escolher fotos
          </>
        )}
      </button>

      <p className="mt-2 mb-0 text-center text-[11px] text-muted">
        Pode selecionar várias de uma vez. São reduzidas no seu aparelho antes de subir, então
        funciona bem no 4G.
      </p>

      {erros.length > 0 && (
        <ul role="alert" className="mt-3 mb-0 list-none p-0 text-[13px] text-red-800">
          {erros.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
