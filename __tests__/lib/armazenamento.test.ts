import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { armazenamento, chaveSegura, urlFoto, redefinirArmazenamento } from '@/lib/armazenamento'

afterAll(async () => {
  await rm(resolve(process.cwd(), process.env.ARMAZENAMENTO_LOCAL_RAIZ ?? '.uploads', 'teste'), { recursive: true, force: true })
})

describe('chaveSegura', () => {
  test('aceita o formato que o próprio código gera', () => {
    expect(chaveSegura('veiculos/12/a1b2c3.webp')).toBe(true)
    expect(chaveSegura('veiculos/12/a1b2c3-mini.webp')).toBe(true)
  })

  test('recusa subir de diretório', () => {
    // A chave chega pela URL em /api/fotos/[...chave]. Sem esta recusa, um
    // pedido a ../../.env.local entregaria a senha do banco pela internet.
    expect(chaveSegura('../.env.local')).toBe(false)
    expect(chaveSegura('veiculos/../../.env.local')).toBe(false)
    expect(chaveSegura('..%2F..%2Fetc%2Fpasswd')).toBe(false)
  })

  test('recusa caminho absoluto e formato inesperado', () => {
    expect(chaveSegura('/etc/passwd')).toBe(false)
    expect(chaveSegura('script.js')).toBe(false)
    expect(chaveSegura('foto.webp.exe')).toBe(false)
    expect(chaveSegura('')).toBe(false)
  })
})

describe('driver local', () => {
  test('grava, lê e apaga', async () => {
    const arm = armazenamento()
    const dados = Buffer.from('conteudo-de-teste')
    await arm.salvar('teste/exemplo.webp', dados, 'image/webp')
    expect((await arm.ler('teste/exemplo.webp')).toString()).toBe('conteudo-de-teste')
    await arm.apagar('teste/exemplo.webp')
    await expect(arm.ler('teste/exemplo.webp')).rejects.toThrow()
  })

  test('apagar arquivo que já sumiu não é erro', async () => {
    // O registro no banco é a fonte da verdade. Se apagar o arquivo estourasse,
    // a foto ficaria pendurada na tela pra sempre.
    await expect(armazenamento().apagar('teste/nao-existe.webp')).resolves.toBeUndefined()
  })

  test('recusa gravar em chave perigosa', async () => {
    await expect(
      armazenamento().salvar('../fora.webp', Buffer.from('x'), 'image/webp'),
    ).rejects.toThrow(/inválida/i)
  })

  test('a URL aponta pra rota que serve o arquivo', () => {
    expect(urlFoto('veiculos/1/foto.webp')).toBe('/api/fotos/veiculos/1/foto.webp')
  })

  test('chave nula não vira URL quebrada', () => {
    expect(urlFoto(null)).toBeNull()
    expect(urlFoto(undefined)).toBeNull()
  })
})

describe('driver r2', () => {
  afterEach(() => {
    delete process.env.ARMAZENAMENTO
    redefinirArmazenamento()
  })

  test('reclama alto quando falta configuração', () => {
    // Falhar na largada é melhor do que subir e só descobrir na primeira foto
    // que o Jair tentar enviar.
    process.env.ARMAZENAMENTO = 'r2'
    redefinirArmazenamento()
    expect(() => armazenamento()).toThrow(/R2_ACCOUNT_ID/)
  })
})
