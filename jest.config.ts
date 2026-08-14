import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  // Diz contra qual banco a suíte vai rodar e BLOQUEIA banco remoto.
  globalSetup: '<rootDir>/jest.setup-global.ts',
  // Fecha a conexão no fim de tudo, mesmo com teste falhando — senão o Jest
  // fica pendurado esperando o socket do Postgres.
  globalTeardown: '<rootDir>/jest.teardown.ts',
  projects: [
    {
      displayName: 'lib',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/lib/**/*.test.ts'],
      // Fecha o pool do Postgres de cada arquivo — sem isso a suíte pendura.
      setupFilesAfterEnv: ['<rootDir>/jest.setup-db.ts'],
      transform: { '^.+\\.(ts|tsx)$': ['ts-jest', {}] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    },
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    },
  ],
}

export default createJestConfig(config)
