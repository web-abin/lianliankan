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
    }),
    {
      name: 'copy-assets-to-dist',
      apply: 'build',
      closeBundle() {
        const src = resolve('assets')
        const dest = resolve('dist/assets')
        if (existsSync(src)) {
          mkdirSync(dest, {recursive: true})
          cpSync(src, dest, {recursive: true})
        }
        const roleSrc = resolve('assets/animate/role')
        const roleDest = resolve('dist/assets/animate/role_ascii')
        if (existsSync(roleSrc)) {
          mkdirSync(roleDest, {recursive: true})
          const files = readdirSync(roleSrc)
          for (const f of files) {
            const m = f.match(/^序列帧-(\d+)\.png$/)
            if (!m) continue
            const n = Number(m[1])
            const pad = String(n).padStart(3, '0')
            cpSync(resolve(roleSrc, f), resolve(roleDest, `role-${pad}.png`))
          }
        }
      }
    }
	]
})
