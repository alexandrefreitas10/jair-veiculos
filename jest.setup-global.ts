// Diz, em alto e bom som, contra qual banco a suíte vai rodar.
//
// Esta trava é herdada do Run Coach, onde a suíte rodou meses contra PRODUÇÃO
// sem nada avisando: dados de teste vazaram pro banco do cliente e cada rodada
// levava 13 minutos por causa da distância até o servidor. Aqui ela nasce pronta.
export default async function globalSetup(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log('\n[testes] sem DATABASE_URL — os testes de banco serão PULADOS\n')
    return
  }

  let host = '?'
  try {
    host = new URL(url).hostname
  } catch {
    /* url malformada; o driver reclama depois com mensagem melhor que a minha */
  }
  const local = /^(localhost|127\.0\.0\.1|::1)$/.test(host)

  if (local) {
    // Cria o schema ANTES do primeiro teste. Vários testes começam limpando
    // tabelas antes de chamar qualquer função que rode as migrações — num banco
    // recém-criado isso morre com "relação não existe".
    const t = Date.now()
    const { initSchema, default: sql } = await import('./src/lib/db')
    await initSchema()
    await sql.end()
    console.log(`\n[testes] banco LOCAL (${host}) — schema pronto em ${Date.now() - t}ms, pode sujar à vontade\n`)
    return
  }

  if (process.env.PERMITIR_BANCO_REMOTO === '1') {
    console.log(`\n[testes] banco REMOTO (${host}) — liberado por PERMITIR_BANCO_REMOTO=1\n`)
    return
  }

  throw new Error(
    `\n${'='.repeat(66)}\n` +
      `  TESTES BLOQUEADOS: DATABASE_URL aponta pra um banco REMOTO\n` +
      `  host: ${host}\n\n` +
      `  Os testes criam e apagam veículos, negócios e custos. Contra o banco\n` +
      `  de produção isso apagaria o estoque real do Jair.\n\n` +
      `  Para rodar local: crie .env.test.local com o DATABASE_URL do Postgres\n` +
      `  da sua máquina (a suíte prefere esse arquivo ao .env.local).\n\n` +
      `  Se precisa MESMO do banco remoto: PERMITIR_BANCO_REMOTO=1\n` +
      `${'='.repeat(66)}\n`,
  )
}
