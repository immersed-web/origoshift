import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  dts: true,
  onSuccess: 'tsc --emitDeclarationOnly --declaration --declarationMap'
});
