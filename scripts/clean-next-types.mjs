import { rmSync } from 'node:fs'

rmSync('.next/dev/types', {
  force: true,
  recursive: true,
})
