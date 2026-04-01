import {defineConfig} from 'vite'
import {resolve} from 'node:path'
import {existsSync, mkdirSync, cpSync, rmSync, readFileSync} from 'node:fs'
import replace from '@rollup/plugin-replace'

/** 从 .env 文件读取 key（容错，找不到时返回空字符串） */
function readEnv(key: string): string {
  try {
    const raw = readFileSync(resolve('.env'), 'utf-8')
    const match = raw.match(new RegExp(`^${key}=(.*)`, 'm'))
    return (match?.[1] ?? '').trim()
  } catch {
    return ''
  }
}
const SUPABASE_URL = readEnv('SUPABAES_PROJECT_URL')
// SUPABAES_PROJECT_SECRET 是 anon JWT，用于客户端 REST 只读查询
const SUPABASE_ANON_KEY = readEnv('SUPABAES_PROJECT_SECRET')

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
      'process.env.NODE_ENV': JSON.stringify('production'),
      // Supabase 客户端常量（anon key 可公开，service_role key 绝不注入客户端）
      '__SUPABASE_URL__': JSON.stringify(SUPABASE_URL),
      '__SUPABASE_ANON_KEY__': JSON.stringify(SUPABASE_ANON_KEY),
      '__EDGE_BASE_URL__': JSON.stringify(`${SUPABASE_URL}/functions/v1`)
    }),
    copyAssetsToDist()
	]
})
