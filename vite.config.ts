import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: ['react', 'react-dom'],
    },
  },
})
