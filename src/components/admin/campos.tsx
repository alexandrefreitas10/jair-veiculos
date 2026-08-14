// Peças de formulário do painel. Ficam juntas num arquivo só porque mudam
// juntas: alterar a altura de toque ou a cor de foco precisa valer para todos
// os campos ao mesmo tempo, senão o formulário fica desalinhado.
//
// A altura mínima de 44px não é estética: é o alvo de toque confortável no
// celular, e o Jair cadastra carro em pé, na rua, com o dedo.

export const ENTRADA =
  'w-full rounded-lg border border-grafite-700 bg-grafite-950 px-3.5 py-2.5 text-grafite-100 placeholder:text-grafite-600 outline-none transition focus:border-ambar-500 min-h-[44px]'

export function Campo({
  rotulo,
  children,
  dica,
  className = '',
}: {
  rotulo: string
  children: React.ReactNode
  dica?: string
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="etiqueta mb-1.5 block">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-grafite-500">{dica}</span>}
    </label>
  )
}

export function Bloco({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-grafite-800 bg-grafite-900 p-5">
      <h2 className="font-display font-semibold text-grafite-50">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-grafite-400">{descricao}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function Interruptor({
  nome,
  rotulo,
  padrao = false,
}: {
  nome: string
  rotulo: string
  padrao?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-grafite-700 bg-grafite-950 px-3.5 py-3 transition hover:border-grafite-600">
      <input
        type="checkbox"
        name={nome}
        defaultChecked={padrao}
        className="h-4 w-4 shrink-0 accent-ambar-500"
      />
      <span className="text-sm text-grafite-200">{rotulo}</span>
    </label>
  )
}
