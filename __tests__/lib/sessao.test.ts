// O módulo de sessão é o porteiro de toda ação do painel. O teste dele importa
// mais do que parece: uma ação de servidor é alcançável por POST direto, sem
// passar por página nenhuma, então este é o único ponto que separa o painel do
// Jair da internet aberta.

const authFalso = jest.fn()
jest.mock('@/auth', () => ({ auth: () => authFalso() }))

import { exigirSessao, temSessao, NaoAutorizado } from '@/lib/sessao'

beforeEach(() => authFalso.mockReset())

test('sem sessão nenhuma, recusa', async () => {
  authFalso.mockResolvedValue(null)
  await expect(exigirSessao()).rejects.toThrow(NaoAutorizado)
})

test('sessão sem usuário, recusa', async () => {
  authFalso.mockResolvedValue({})
  await expect(exigirSessao()).rejects.toThrow(NaoAutorizado)
})

test('usuário sem id, recusa', async () => {
  // Um objeto de usuário incompleto não pode passar por autenticado.
  authFalso.mockResolvedValue({ user: { name: 'Jair' } })
  await expect(exigirSessao()).rejects.toThrow(NaoAutorizado)
})

test('sessão válida devolve o usuário', async () => {
  authFalso.mockResolvedValue({ user: { id: '1', name: 'Jair Junior' } })
  await expect(exigirSessao()).resolves.toEqual({ id: '1', nome: 'Jair Junior' })
})

test('temSessao não estoura quando não há sessão', async () => {
  authFalso.mockResolvedValue(null)
  await expect(temSessao()).resolves.toBe(false)
})
