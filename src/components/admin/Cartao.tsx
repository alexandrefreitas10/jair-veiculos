export function Cartao({
  etiqueta,
  valor,
  detalhe,
  tom = 'neutro',
}: {
  etiqueta: string
  valor: string
  detalhe?: string
  tom?: 'neutro' | 'positivo' | 'negativo' | 'destaque'
}) {
  // O lucro negativo precisa gritar. Um prejuízo em cinza, no meio de quatro
  // cartões iguais, passa despercebido — e é justamente o número que deveria
  // fazer o Jair parar e olhar.
  const cor =
    tom === 'positivo'
      ? 'text-conferido'
      : tom === 'negativo'
        ? 'text-red-400'
        : tom === 'destaque'
          ? 'text-ambar-400'
          : 'text-grafite-50'

  return (
    <div className="rounded-xl border border-grafite-800 bg-grafite-900 p-5">
      <p className="etiqueta">{etiqueta}</p>
      <p className={`numero mt-2 text-2xl font-semibold ${cor}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-sm text-grafite-500">{detalhe}</p>}
    </div>
  )
}
