import {defineConfig} from 'vite'
import {resolve} from 'node:path'
import {existsSync, mkdirSync, cpSync, readdirSync} from 'node:fs'
import replace from '@rollup/plugin-replace'

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
    })
	]
})
