#!/bin/sh

set -u

echo "🔎 Pre-commit: fixing staged files"
echo "   This hook is intentionally light: it runs autofixers only for files in this commit."
echo ""

files_file=$(mktemp)
trap 'rm -f "$files_file"' EXIT

git diff --cached --name-only --diff-filter=ACMR > "$files_file"

if [ ! -s "$files_file" ]; then
  echo "✅ No staged files to check."
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
        echo "❌ Prettier could not format or stage: $file"
        echo "   Check the error above, fix the file manually, stage it, then commit again."
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
        echo "❌ ESLint could not fix or stage: $file"
        echo "   Some issues need a manual code change. Fix them, stage the file, and commit again."
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
        echo "❌ Stylelint could not fix or stage: $file"
        echo "   Some style issues need a manual change. Fix them, stage the file, and commit again."
        echo ""
      fi
      ;;
  esac
done < "$files_file"

if [ "$fixed" -eq 0 ]; then
  echo "✅ No staged files need autofix."
  exit 0
fi

if [ "$failed" -ne 0 ]; then
  echo "🚫 Commit blocked."
  echo "   Fix the issues above, stage the changes, and commit again."
  exit 1
fi

echo "✅ Pre-commit passed: staged files were autofixed and staged."
