import { rmSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'

  return {
    resolve: {
      alias: {
        '@': '/src'  // Simplified alias
      },
    },
    build: {
      sourcemap: true,
      minify: false,
      rollupOptions: {
        external: [
          ...Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
          'path',
          'fs',
        ],
      }
    },
    optimizeDeps: {
      exclude: ['electron']
    },
    plugins: [
      react(),
      electron({
        main: {
          entry: 'electron/main/index.ts',
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
            } else {
              args.startup()
            }
          },
          vite: {
            build: {
              sourcemap: true,
              minify: false,
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: [
                  ...Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                  'electron',
                  'path',
                  'fs'
                ],
              },
            },
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              sourcemap: true,
              minify: false,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: [
                  ...Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                  'electron',
                  'path',
                  'fs'
                ],
              },
            },
          },
        },
        renderer: {},
      }),
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
      return {
        host: url.hostname,
        port: +url.port,
      }
    })(),
    clearScreen: false,
  }
})

