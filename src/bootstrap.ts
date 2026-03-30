/**
 * 延迟启动入口，避免在 onLoad 阶段访问 canvas / wx 导致 __wxConfig.useWebWorker 取不到值。
 * 由 app.ts 在 setTimeout 后动态加载并执行。
 */
export async function run() {
  const core = await import('~/core')
  ;(globalThis as unknown as { __store?: typeof core.store }).__store = core.store

  const { loading } = await import('~/route')
  await import('~/navigator')
  await loading.show()
}
