/* eslint-disable no-console */

import { spawnSync } from 'node:child_process'

const runPnpm = (args) =>
  spawnSync('pnpm', args, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  })

const steps = [
  {
    name: 'ESLint',
    args: ['lint'],
    hint: 'Исправь ошибки качества TypeScript/React-кода из вывода выше.',
  },
  {
    name: 'Stylelint',
    args: ['lint:styles'],
    hint: 'Исправь CSS/SCSS-ошибки из вывода выше.',
  },
  {
    name: 'Prettier',
    args: ['format:check'],
    hint: 'Запусти pnpm format, проверь diff и повтори проверку.',
  },
  {
    name: 'TypeScript',
    args: ['typecheck'],
    hint: 'Исправь ошибки типов перед повторной проверкой.',
  },
  {
    name: 'Next.js build',
    args: ['build'],
    hint: 'Исправь ошибки сборки. Для изменений Next.js API проверь node_modules/next/dist/docs/.',
  },
]

const runStep = ({ name, args, hint }) => {
  const command = `pnpm ${args.join(' ')}`

  console.log(`▶ ${name}`)
  console.log(`   ${command}`)

  const result = runPnpm(args)

  if (result.status === 0) {
    console.log(`✅ ${name} пройден`)
    console.log('')
    return
  }

  console.log('')
  console.log(`❌ ${name} не пройден`)
  console.log(`   ${hint}`)
  console.log('🚫 Проверка остановлена. Исправь проблему и запусти команду снова.')
  process.exit(result.status ?? 1)
}

console.log('🚀 Check: запускаю полную проверку проекта')
console.log('')

steps.forEach(runStep)

console.log('✅ Check пройден: проект готов к отправке.')
console.log('🎉 Все проверки завершились успешно.')
