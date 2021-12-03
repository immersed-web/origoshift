/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  clearMocks: true,
  testEnvironment: 'node',
  // globals: {
  //   'ts-jest': {
  //     compiler: 'ttypescript'
  //   }
  // },
  setupFilesAfterEnv: [
    '<rootDir>/src/testUtils/prismaMock.ts'
  ]
  // transform: {
  //   '.(ts|tsx)': 'ts-jest'
  // },
  // setupFiles: [
  //   '<rootDir>/ts-auto-mock-config.ts'
  // ]
};