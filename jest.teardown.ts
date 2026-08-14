// Fecha o pool no fim de TUDO, mesmo com teste falhando ou estourando o tempo.
// Sem isto o Jest termina os testes e fica pendurado esperando o socket do
// Postgres, e quem está rodando acha que travou.
export default async function globalTeardown(): Promise<void> {
  if (!process.env.DATABASE_URL) return
  try {
    const { default: sql } = await import('./src/lib/db')
    await sql.end({ timeout: 5 })
  } catch {
    /* o pool já pode ter sido fechado por outro caminho; não é motivo de falha */
  }
}
