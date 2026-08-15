/**
 * Célula da faixa de indicadores do livro do pátio.
 *
 * A separação entre células é uma borda esquerda hairline, não um card por
 * indicador — é o que o handoff pede e o que faz a faixa ler como uma régua de
 * números, não como quatro caixas soltas. A primeira célula não tem borda.
 */
export function Cartao({
  etiqueta,
  valor,
  nota,
  tom = 'neutro',
  primeira = false,
}: {
  etiqueta: string
  valor: string
  nota?: string
  tom?: 'neutro' | 'accent' | 'negativo'
  primeira?: boolean
}) {
  // Prejuízo precisa gritar. Um número negativo em cinza, no meio de quatro
  // indicadores iguais, passa despercebido — e é justamente o que deveria fazer
  // o Jair parar e olhar.
  const cor =
    tom === 'accent' ? 'text-accent-700' : tom === 'negativo' ? 'text-red-700' : 'text-text'

  return (
    <div className={primeira ? 'px-4 py-3' : 'border-l border-[var(--color-divider)] px-4 py-3'}>
      <p className="m-0 text-[10px] tracking-[0.1em] text-muted uppercase">{etiqueta}</p>
      <p
        className={`jj-num m-0 mt-1 font-heading text-[27px] leading-none font-semibold tracking-[-0.02em] ${cor}`}
      >
        {valor}
      </p>
      {nota && <p className="m-0 mt-1 text-[11px] text-muted">{nota}</p>}
    </div>
  )
}
