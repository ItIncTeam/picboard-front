#!/bin/sh

set -u

echo "🚀 Pre-push: проверяю ветку перед отправкой"
echo "   Хук строгий: ветка сейчас будет отправлена на сервер."
echo ""

if ! sh scripts/check.sh; then
  echo "🚫 Push остановлен."
  exit 1
fi

echo "✅ Pre-push пройден: ветка готова к отправке."
echo "🎉 Push можно завершать."
