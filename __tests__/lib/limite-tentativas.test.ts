import {
  conferirBloqueio,
  registrarFalha,
  limparTentativas,
  zerarTudo,
} from '@/lib/limite-tentativas'

beforeEach(() => zerarTudo())

const AGORA = 1_770_000_000_000 // instante fixo; a função aceita o tempo por parâmetro

test('quatro erros ainda deixam tentar', () => {
  for (let i = 0; i < 4; i++) registrarFalha('jair@exemplo.com', AGORA)
  expect(conferirBloqueio('jair@exemplo.com', AGORA).bloqueado).toBe(false)
})

test('o quinto erro bloqueia', () => {
  for (let i = 0; i < 5; i++) registrarFalha('jair@exemplo.com', AGORA)
  const s = conferirBloqueio('jair@exemplo.com', AGORA)
  expect(s.bloqueado).toBe(true)
  expect(s.restaSegundos).toBeGreaterThan(0)
})

test('o bloqueio passa depois de 15 minutos', () => {
  for (let i = 0; i < 5; i++) registrarFalha('jair@exemplo.com', AGORA)
  const depois = AGORA + 15 * 60 * 1000 + 1
  expect(conferirBloqueio('jair@exemplo.com', depois).bloqueado).toBe(false)
})

test('erros espalhados no tempo não somam', () => {
  // Cinco erros de digitação ao longo de meses não podem bloquear o Jair
  // justamente no dia em que ele acertar a senha.
  for (let i = 0; i < 4; i++) {
    registrarFalha('jair@exemplo.com', AGORA + i * 20 * 60 * 1000)
  }
  const bemDepois = AGORA + 4 * 20 * 60 * 1000
  expect(registrarFalha('jair@exemplo.com', bemDepois).bloqueado).toBe(false)
})

test('login certo zera a contagem', () => {
  for (let i = 0; i < 4; i++) registrarFalha('jair@exemplo.com', AGORA)
  limparTentativas('jair@exemplo.com')
  expect(registrarFalha('jair@exemplo.com', AGORA).bloqueado).toBe(false)
})

test('o bloqueio de um e-mail não afeta outro', () => {
  for (let i = 0; i < 5; i++) registrarFalha('atacante@exemplo.com', AGORA)
  expect(conferirBloqueio('jair@exemplo.com', AGORA).bloqueado).toBe(false)
})
