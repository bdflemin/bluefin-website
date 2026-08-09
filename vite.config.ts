import type { Plugin } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const directoryEntryPaths = new Set(['/dakota', '/server', '/wolves'])

function redirectDirectoryEntries(): Plugin {
  return {
    name: 'redirect-directory-entries',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!directoryEntryPaths.has(url.pathname)) {
          next()
          return
        }

        res.writeHead(302, { Location: `${url.pathname}/${url.search}` })
        res.end()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/.worktrees/**',
    ],
    coverage: {
      provider: 'v8',
      // Count every source file, not only files imported by tests, so that
      // untested components cannot sit at 0% outside the report.
      include: ['src/**'],
      reporter: ['text', 'lcov'],
      thresholds: {
        // Global ratchet ~1pt below measured (77.8/67.3/79.5/77.6) so normal
        // churn does not trip the gate while regressions still fail CI.
        'statements': 77,
        'branches': 66,
        'functions': 78,
        'lines': 76,
        // Backstop for Vue components (measured 72.3/62.7/76.3): wider margin
        // because a single added component moves the aggregate more.
        'src/components/**': {
          statements: 70,
          branches: 60,
          functions: 74,
          lines: 70,
        },
      },
    },
  },
  plugins: [
    redirectDirectoryEntries(),
    tailwindcss(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('google-cast-')
        }
      }
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        testing: resolve(__dirname, 'public/testing.html'),
        dakota: resolve(__dirname, 'dakota/index.html'),
        server: resolve(__dirname, 'server/index.html'),
        wolves: resolve(__dirname, 'wolves/index.html'),
      },
      output: {
        manualChunks: (id: string) => {
          if (['vue', 'vue-i18n'].some(mod => id.includes(`/node_modules/${mod}`))) {
            return 'vue-vendor'
          }
          if (id.includes('/node_modules/@iconify-prerendered/vue-mdi')) {
            return 'ui-icons'
          }
          if (['marked', 'js-yaml', '@vueuse/core', '@vueuse/components'].some(mod => id.includes(`/node_modules/${mod}`))) {
            return 'utils'
          }
          return undefined
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@/composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
})
