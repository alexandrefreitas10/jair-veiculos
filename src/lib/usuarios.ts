import bcrypt from 'bcryptjs'
import sql, { initSchema } from '@/lib/db'

// Só o Jair usa o painel. Não existe tela de cadastro: o usuário nasce pelo
// script `npm run criar-usuario`. Um site de anúncio com cadastro aberto seria
// convite pra qualquer um publicar carro no nome dele.

export type Usuario = {
  id: number
  nome: string
  email: string
  senhaHash: string
}

/** O teclado do celular põe maiúscula na primeira letra e às vezes um espaço
 *  no fim. Sem normalizar, o Jair digitaria o e-mail certo e ouviria "usuário
 *  não encontrado". */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

const CUSTO_BCRYPT = 10

export async function criarUsuario(dados: { nome: string; email: string; senha: string }): Promise<number> {
  await initSchema()
  const hash = await bcrypt.hash(dados.senha, CUSTO_BCRYPT)
  const [linha] = await sql<{ id: number }[]>`
    INSERT INTO usuarios (nome, email, senha_hash)
    VALUES (${dados.nome}, ${normalizarEmail(dados.email)}, ${hash})
    RETURNING id
  `
  return linha.id
}

export async function buscarPorEmail(email: string): Promise<Usuario | null> {
  await initSchema()
  const [l] = await sql<{ id: number; nome: string; email: string; senha_hash: string }[]>`
    SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ${normalizarEmail(email)}
  `
  return l ? { id: l.id, nome: l.nome, email: l.email, senhaHash: l.senha_hash } : null
}

export async function conferirSenha(usuario: Usuario, senha: string): Promise<boolean> {
  if (!senha) return false
  return bcrypt.compare(senha, usuario.senhaHash)
}

export async function totalUsuarios(): Promise<number> {
  await initSchema()
  const [l] = await sql<{ total: string }[]>`SELECT COUNT(*)::text AS total FROM usuarios`
  return Number(l?.total ?? 0)
}

export async function trocarSenha(id: number, senhaNova: string): Promise<void> {
  await initSchema()
  const hash = await bcrypt.hash(senhaNova, CUSTO_BCRYPT)
  await sql`UPDATE usuarios SET senha_hash = ${hash} WHERE id = ${id}`
}
