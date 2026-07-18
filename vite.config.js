import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' gera caminhos relativos no build — funciona igualmente na raiz de um
// domínio (Vercel) e num subdiretório (GitHub Pages /<repo>/), sem ajuste extra.
export default defineConfig({
  plugins: [react()],
  base: './',
})
