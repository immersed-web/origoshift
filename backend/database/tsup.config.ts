import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  legacyOutput: true,
  onSuccess: 'tsc --emitDeclarationOnly --declaration --declarationMap'
})
