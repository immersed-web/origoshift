import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/mediasoupSchemas.ts'],
  format: ['esm', 'cjs'],
  clean: false,
  dts: true,
  onSuccess: 'tsc --emitDeclarationOnly --declaration --declarationMap'
})
