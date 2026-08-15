import { conferirConfiguracao } from '@/lib/db'

// Este teste existe por causa de um episódio real, no primeiro deploy
// (15/08/2026): o site subiu, as páginas que usam banco davam 500, e o log
// dizia `ECONNREFUSED 127.0.0.1:5432`. Parecia banco caído ou problema de rede.
// Era só a variável DATABASE_URL em branco — a biblioteca `postgres`, chamada
// sem URL, assume `localhost:5432` como padrão.
//
// O custo de um erro assim não é o conserto, é o tempo procurando no lugar
// errado. A mensagem tem que dizer o que fazer.

describe('em produção', () => {
  test('sem DATABASE_URL, recusa com mensagem que diz o que fazer', () => {
    expect(() => conferirConfiguracao('', 'production')).toThrow(/DATABASE_URL/)
    expect(() => conferirConfiguracao('', 'production')).toThrow(/Internal Database URL/)
  })

  test('a mensagem cita o sintoma, pra quem chegar pelo log encontrar', () => {
    // Quem vê "ECONNREFUSED" no log e pesquisa, precisa cair nesta explicação.
    expect(() => conferirConfiguracao('', 'production')).toThrow(/ECONNREFUSED/)
  })

  test('com DATABASE_URL, deixa passar', () => {
    expect(() => conferirConfiguracao('postgresql://u:s@host:5432/db', 'production')).not.toThrow()
  })
})

describe('fora de produção', () => {
  test('sem DATABASE_URL, deixa passar', () => {
    // Os testes que não tocam o banco precisam poder importar o módulo.
    expect(() => conferirConfiguracao('', 'test')).not.toThrow()
    expect(() => conferirConfiguracao('', 'development')).not.toThrow()
    expect(() => conferirConfiguracao('', undefined)).not.toThrow()
  })
})
