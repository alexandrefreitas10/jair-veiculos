// Peças de formulário do painel.
//
// Agora são só apelidos para as classes do design system (`.input`, `.card`),
// definidas em globals.css. Antes cada campo carregava uma pilha de utilitárias
// repetidas; com o sistema portado, a classe já traz borda, foco e altura.
//
// `ENTRADA` continua existindo como constante porque dezenas de campos a usam,
// e um apelido é mais fácil de trocar do que uma busca-e-substitui.

export const ENTRADA = 'input'

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
    <label className={`field block ${className}`}>
      <span>{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-[11px] text-muted">{dica}</span>}
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
    <section className="card">
      <h2 className="card-title m-0">{titulo}</h2>
      {descricao && <p className="m-0 text-[13px] text-muted">{descricao}</p>}
      <div className="mt-2">{children}</div>
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
    // min-h-[44px]: alvo de toque confortável. O Jair cadastra carro em pé, na
    // rua, com o dedo.
    <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-divider)] px-3 py-2 hover:bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)]">
      <input
        type="checkbox"
        name={nome}
        defaultChecked={padrao}
        className="h-4 w-4 shrink-0 accent-[var(--color-accent)]"
      />
      <span className="text-[13px]">{rotulo}</span>
    </label>
  )
}

/** Segmentado do design system, para uso dentro de formulários com `name`. */
export function Segmentado({
  nome,
  opcoes,
  padrao,
  className = '',
}: {
  nome: string
  opcoes: Array<{ valor: string; rotulo: string }>
  padrao?: string
  className?: string
}) {
  return (
    <div className={`seg ${className}`} role="group">
      {opcoes.map((o) => (
        <label key={o.valor} className="seg-opt">
          <input type="radio" name={nome} value={o.valor} defaultChecked={padrao === o.valor} />
          {o.rotulo}
        </label>
      ))}
    </div>
  )
}
