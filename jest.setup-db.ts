// Fecha o pool do Postgres no fim de CADA arquivo de teste.
//
// Sem isto a suíte trava sem imprimir nada. O motivo não é óbvio: o Jest dá a
// cada arquivo de teste seu próprio registro de módulos, então cada arquivo
// abre um pool novo. O `globalTeardown` importa `src/lib/db` de fora desse
// registro e fecha um pool diferente — o pool que os testes realmente usaram
// continua aberto, e o Jest espera para sempre por um socket que ninguém vai
// fechar. O sintoma é uma suíte pendurada com a saída vazia.
afterAll(async () => {
  const { default: sql } = await import('./src/lib/db')
  await sql.end({ timeout: 5 })
})
