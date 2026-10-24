import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: { alias: { src: resolve(__dirname, 'src') } },
  test: {
    include: ['test/e2e/**/*.e2e-spec.ts'],
    environment: 'node',
    setupFiles: ['test/e2e/setup-env.ts'],
    fileParallelism: false,
  },
});
