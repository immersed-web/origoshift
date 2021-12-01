/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      compiler: 'ttypescript'
    }
  },
  // transform: {
  //   '.(ts|tsx)': 'ts-jest'
  // },
  setupFiles: [
    '<rootDir>/ts-auto-mock-config.ts'
  ]
};