/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */


//Handle path aliases when testing
// import {pathsToModuleMapper } from 'ts-jest';
// import { compilerOptions } from './tsconfig.json';

module.exports = {
  roots: ['<rootDir>/src'],
  // moduleNameMapper: pathsToModuleMapper(compilerOptions.paths),
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  // projects: []
  preset: 'ts-jest',
  testEnvironment: 'node',
};