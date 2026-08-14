// Cria o usuário do painel. Rodar uma vez, na instalação:
//
//   npm run criar-usuario -- "Jair Junior" jair@exemplo.com "senha-forte-aqui"
//
// Não existe tela de cadastro de propósito: o painel tem um dono só. Um site de
// anúncio com auto-cadastro aberto deixaria qualquer um publicar carro no nome
// dele.
import bcrypt from 'bcryptjs'
import postgres from 'postgres'

const [nome, email, senha] = process.argv.slice(2)

if (!nome || !email || !senha) {
  console.error('\nUso: npm run criar-usuario -- "Nome" email@exemplo.com "senha"\n')
  process.exit(1)
}

if (senha.length < 8) {
  console.error('\nA senha precisa de pelo menos 8 caracteres.\n')
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('\nSem DATABASE_URL. Confira o .env.local.\n')
  process.exit(1)
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url)
const sql = postgres(url, { ssl: local ? false : 'require', max: 1, onnotice: () => {} })

try {
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  const emailNormalizado = email.trim().toLowerCase()
  const hash = await bcrypt.hash(senha, 10)

  // Se já existe, troca a senha em vez de estourar — é assim que o Jair
  // recupera o acesso quando esquecer.
  const [linha] = await sql`
    INSERT INTO usuarios (nome, email, senha_hash)
    VALUES (${nome}, ${emailNormalizado}, ${hash})
    ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, senha_hash = EXCLUDED.senha_hash
    RETURNING id, (xmax = 0) AS criado
  `

  console.log(
    linha.criado
      ? `\nUsuário criado: ${emailNormalizado} (id ${linha.id})\n`
      : `\nUsuário já existia — senha atualizada: ${emailNormalizado}\n`,
  )
} catch (err) {
  console.error('\nFalhou:', err.message, '\n')
  process.exitCode = 1
} finally {
  await sql.end()
}
