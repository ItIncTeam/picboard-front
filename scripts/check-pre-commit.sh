#!/bin/sh

set -u

echo "🔎 Pre-commit: проверяю staged-файлы"
echo "   Хук легкий: запускает автоисправления только для файлов текущего коммита."
echo ""

files_file=$(mktemp)
trap 'rm -f "$files_file"' EXIT

git diff --cached --name-only --diff-filter=ACMR > "$files_file"

if [ ! -s "$files_file" ]; then
  echo "✅ Нет staged-файлов для проверки."
  exit 0
fi

fixed=0
failed=0

while IFS= read -r file; do
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.json|*.css|*.scss|*.md|*.mjs|*.cjs|*.yml|*.yaml)
      fixed=$((fixed + 1))
      echo "🧹 prettier --write $file"

      if ! pnpm exec prettier --write "$file" || ! git add "$file"; then
        failed=1
        echo ""
        echo "❌ Prettier не смог отформатировать или добавить файл: $file"
        echo "   Проверь ошибку выше, поправь файл вручную, добавь его в stage и повтори commit."
        echo ""
      fi
      ;;
  esac

  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs)
      fixed=$((fixed + 1))
      echo "🔧 eslint --fix $file"

      if ! pnpm exec eslint --fix "$file" || ! git add "$file"; then
        failed=1
        echo ""
        echo "❌ ESLint не смог исправить или добавить файл: $file"
        echo "   Часть ошибок требует ручной правки. Исправь файл, добавь его в stage и повтори commit."
        echo ""
      fi
      ;;
  esac

  case "$file" in
    *.css|*.scss)
      fixed=$((fixed + 1))
      echo "🎨 stylelint --fix $file"

      if ! pnpm exec stylelint --fix "$file" || ! git add "$file"; then
        failed=1
        echo ""
        echo "❌ Stylelint не смог исправить или добавить файл: $file"
        echo "   Часть ошибок требует ручной правки. Исправь файл, добавь его в stage и повтори commit."
        echo ""
      fi
      ;;
  esac
done < "$files_file"

if [ "$fixed" -eq 0 ]; then
  echo "✅ Staged-файлы не требуют автоисправлений."
  exit 0
fi

if [ "$failed" -ne 0 ]; then
  echo "🚫 Commit остановлен."
  echo "   Исправь ошибки выше, добавь изменения в stage и повтори commit."
  exit 1
fi

echo "✅ Pre-commit пройден: staged-файлы исправлены и добавлены обратно."
echo "🎉 Commit можно завершать."
