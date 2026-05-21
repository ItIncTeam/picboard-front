import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const hooksPath = '.husky'

const isInsideWorkTree = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
})

if (isInsideWorkTree.status !== 0 || isInsideWorkTree.stdout.trim() !== 'true') {
  process.exit(0)
}

if (!existsSync(hooksPath)) {
  console.warn(`Git hooks directory "${hooksPath}" was not found. Skipping hook setup.`)
  process.exit(0)
}

const result = spawnSync('git', ['config', 'core.hooksPath', hooksPath], {
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
