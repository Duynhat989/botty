import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const DEFAULT_SITE_URL = 'https://botty.live'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'math-field',
          },
        },
      }),
      {
        name: 'dynageo-html-meta',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_URL__', siteUrl)
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 1111,
    },
  }
})
