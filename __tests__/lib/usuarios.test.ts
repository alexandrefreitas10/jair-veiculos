import sql, { initSchema } from '@/lib/db'
import { criarUsuario, buscarPorEmail, conferirSenha, normalizarEmail, totalUsuarios } from '@/lib/usuarios'

const rodar = process.env.DATABASE_URL ? describe : describe.skip

rodar('usuários', () => {
  beforeAll(async () => {
    await initSchema()
  })

  beforeEach(async () => {
    await sql`DELETE FROM usuarios`
  })

  test('a senha nunca é gravada em texto puro', async () => {
    await criarUsuario({ nome: 'Jair Junior', email: 'jair@exemplo.com', senha: 'senha-secreta-123' })
    const [linha] = await sql<{ senha_hash: string }[]>`SELECT senha_hash FROM usuarios`
    expect(linha.senha_hash).not.toContain('senha-secreta-123')
    expect(linha.senha_hash.startsWith('$2')).toBe(true) // formato do bcrypt
  })

  test('confere a senha certa e recusa a errada', async () => {
    await criarUsuario({ nome: 'Jair', email: 'jair@exemplo.com', senha: 'abacaxi-2026' })
    const usuario = (await buscarPorEmail('jair@exemplo.com'))!
    expect(await conferirSenha(usuario, 'abacaxi-2026')).toBe(true)
    expect(await conferirSenha(usuario, 'abacaxi-2025')).toBe(false)
    expect(await conferirSenha(usuario, '')).toBe(false)
  })

  test('e-mail com maiúscula e espaço sobrando ainda acha o usuário', async () => {
    // O Jair vai digitar no celular, com o teclado colocando maiúscula
    // automática na primeira letra.
    await criarUsuario({ nome: 'Jair', email: 'jair@exemplo.com', senha: 'x' })
    expect(await buscarPorEmail('  JAIR@Exemplo.COM ')).not.toBeNull()
  })

  test('normalizarEmail deixa minúsculo e sem espaço', () => {
    expect(normalizarEmail('  JAIR@Exemplo.COM ')).toBe('jair@exemplo.com')
  })

  test('e-mail repetido é recusado', async () => {
    await criarUsuario({ nome: 'Jair', email: 'jair@exemplo.com', senha: 'x' })
    await expect(
      criarUsuario({ nome: 'Outro', email: 'jair@exemplo.com', senha: 'y' }),
    ).rejects.toThrow()
  })

  test('usuário inexistente devolve null em vez de estourar', async () => {
    expect(await buscarPorEmail('ninguem@exemplo.com')).toBeNull()
  })

  test('totalUsuarios conta quantos existem', async () => {
    expect(await totalUsuarios()).toBe(0)
    await criarUsuario({ nome: 'Jair', email: 'jair@exemplo.com', senha: 'x' })
    expect(await totalUsuarios()).toBe(1)
  })
})
