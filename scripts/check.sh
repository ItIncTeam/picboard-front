#!/bin/sh

set -u

echo "🚀 Check: запускаю полную проверку проекта"
echo ""

run_step() {
  name="$1"
  command="$2"
  hint="$3"

  echo "▶ $name"
  echo "   $command"

  if sh -c "$command"; then
    echo "✅ $name пройден"
    echo ""
    return 0
  fi

  echo ""
  echo "❌ $name не пройден"
  echo "   $hint"
  echo "🚫 Проверка остановлена. Исправь проблему и запусти команду снова."
  exit 1
}

run_step "ESLint" "pnpm lint" "Исправь ошибки качества TypeScript/React-кода из вывода выше."
run_step "Stylelint" "pnpm lint:styles" "Исправь CSS/SCSS-ошибки из вывода выше."
run_step "Prettier" "pnpm format:check" "Запусти pnpm format, проверь diff и повтори проверку."
run_step "TypeScript" "pnpm typecheck" "Исправь ошибки типов перед повторной проверкой."
run_step "Next.js build" "pnpm build" "Исправь ошибки сборки. Для изменений Next.js API проверь node_modules/next/dist/docs/."

echo "✅ Check пройден: проект готов к отправке."
echo "🎉 Все проверки завершились успешно."
