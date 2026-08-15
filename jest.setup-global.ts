// Diz, em alto e bom som, contra qual banco a suíte vai rodar.
//
// Esta trava é herdada do Run Coach, onde a suíte rodou meses contra PRODUÇÃO
// sem nada avisando: dados de teste vazaram pro banco do cliente e cada rodada
// levava 13 minutos por causa da distância até o servidor. Aqui ela nasce pronta.
export default async function globalSetup(): Promise<void> {
  // A pasta de arquivos precisa ser só dos testes.
  //
  // Mesmo engano do banco, um andar abaixo: a suíte grava fotos de verdade em
  // disco e limpa a pasta no fim. Enquanto ela usou a mesma pasta do app, cada
  // rodada apagava as fotos dos carros de desenvolvimento — e o sintoma
  // aparecia longe da causa, com a vitrine abrindo sem imagem nenhuma e 404 no
  // log do servidor.
  const raiz = process.env.ARMAZENAMENTO_LOCAL_RAIZ ?? ''
  if (!raiz.endsWith('-test')) {
    throw new Error(
      `\n${'='.repeat(66)}\n` +
        `  TESTES BLOQUEADOS: ARMAZENAMENTO_LOCAL_RAIZ não termina em -test\n` +
        `  valor atual: ${raiz || '(vazio)'}\n\n` +
        `  A suíte grava e apaga arquivos nessa pasta. Apontada para a pasta\n` +
        `  do app, ela apaga as fotos dos veículos de desenvolvimento.\n\n` +
        `  Defina no .env.test.local:  ARMAZENAMENTO_LOCAL_RAIZ=.uploads-test\n` +
        `${'='.repeat(66)}\n`,
    )
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    console.log('\n[testes] sem DATABASE_URL — os testes de banco serão PULADOS\n')
    return
  }

  let host = '?'
  let banco = '?'
  try {
    const parsed = new URL(url)
    host = parsed.hostname
    banco = parsed.pathname.replace(/^\//, '')
  } catch {
    /* url malformada; o driver reclama depois com mensagem melhor que a minha */
  }
  const local = /^(localhost|127\.0\.0\.1|::1)$/.test(host)

  // O nome do banco PRECISA terminar em _test.
  //
  // A trava de host remoto não bastava, e isso não é hipótese: em 15/08/2026 a
  // suíte rodou contra o banco de desenvolvimento por semanas e apagou os dados
  // de demonstração. A causa foi banal — os dois arquivos de ambiente estavam
  // na ordem errada no `npm test`, e o `.env.local` sobrescrevia o
  // `.env.test.local`. Como os dois bancos eram `localhost`, a checagem de host
  // aprovou e ainda imprimiu "pode sujar à vontade".
  //
  // Host certo e banco errado é um engano silencioso. O sufixo torna a
  // intenção explícita: um banco chamado `_test` foi criado para ser destruído.
  if (local && !banco.endsWith('_test')) {
    throw new Error(
      `\n${'='.repeat(66)}\n` +
        `  TESTES BLOQUEADOS: o banco "${banco}" não termina em _test\n\n` +
        `  A suíte apaga veículos, negócios e custos a cada teste. Se este for\n` +
        `  o banco de desenvolvimento, você perde o que estiver nele.\n\n` +
        `  Confira o .env.test.local e a ORDEM dos --env-file no "npm test":\n` +
        `  o último arquivo é o que vale, então .env.test.local vem por último.\n` +
        `${'='.repeat(66)}\n`,
    )
  }

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
