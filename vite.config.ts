import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'cli/index': resolve(__dirname, 'src/cli/index.ts')
      },
      formats: ['es']
    },
    rollupOptions: {
      external: ['fs', 'path', 'url', 'commander', 'child_process'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: (chunkInfo) => {
          // CLI 入口文件需要特殊处理路径
          if (chunkInfo.name === 'cli/index') {
            return 'cli/index.js'
          }
          return '[name].js'
        },
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    sourcemap: true,
    minify: false
  }
})

