import {defineConfig} from 'vite'
import {resolve} from 'node:path'
import {existsSync, mkdirSync, cpSync, rmSync} from 'node:fs'
import replace from '@rollup/plugin-replace'

/** 将 `assets/` 全量同步到 `dist/assets/`，避免新增切图未复制导致微信工具 ENOENT */
function copyAssetsToDist() {
  return {
    name: 'copy-assets-to-dist',
    closeBundle() {
      const src = resolve('assets')
      const dest = resolve('dist/assets')
      if (!existsSync(src)) return
      mkdirSync(resolve('dist'), {recursive: true})
      if (existsSync(dest)) rmSync(dest, {recursive: true, force: true})
      cpSync(src, dest, {recursive: true})
    }
  }
}

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve('.'),
			'~': resolve('src'),
		}
	},

	build: {
		minify: 'esbuild',
		emptyOutDir: false,
		lib: {
			entry: [resolve('src/app.ts')],
			formats: ['cjs'],
			fileName: () => 'game.js'
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
			},
		},
	},

	plugins: [
    replace({
      preventAssignment: false,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    copyAssetsToDist()
	]
})
