import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'node18',
  clean: false,
  dts: true,
  bundle: true,
  onSuccess: 'tsc --emitDeclarationOnly --declaration --declarationMap'
});
