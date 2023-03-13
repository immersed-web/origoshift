import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/mediasoupSchemas.ts'],
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  onSuccess: 'tsc --emitDeclarationOnly --declaration --declarationMap'
})
