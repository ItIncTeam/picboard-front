#!/bin/sh

set -u

echo "🚀 Pre-push: running full project checks"
echo "   This hook is stricter because the branch is about to be pushed to the server."
echo ""

run_step() {
  name="$1"
  command="$2"
  hint="$3"

  echo "▶ $name"
  echo "   $command"

  if sh -c "$command"; then
    echo "✅ $name passed"
    echo ""
    return 0
  fi

  echo ""
  echo "❌ $name failed"
  echo "   $hint"
  echo "🚫 Push blocked. Fix the issue and run the command again."
  exit 1
}

run_step "ESLint" "pnpm lint" "Fix TypeScript/React code-quality issues reported above."
run_step "Stylelint" "pnpm lint:styles" "Fix CSS/SCSS issues reported above."
run_step "Prettier" "pnpm format:check" "Run pnpm format, review the diff, then try again."
run_step "TypeScript" "pnpm typecheck" "Fix type errors before pushing."
run_step "Next.js build" "pnpm build" "Fix build errors. For Next.js API changes, check node_modules/next/dist/docs/."

echo "✅ Pre-push passed: branch is ready to push."
