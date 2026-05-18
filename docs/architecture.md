# Architecture

Основной источник правил: [Picboard Frontend Style Guide](./style_guide_full.md). Этот файл
расшифровывает архитектурные правила и не должен им противоречить.

## Main Approach

Проект следует feature-first подходу, близкому к FSD. Цель — держать доменную логику рядом с
feature и не превращать `shared` в свалку.

## Recommended Structure

```text
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
```

Для текущего Next.js App Router проекта допустима структура от корня приложения, но правила
ответственности слоев остаются теми же. Перед изменением Next.js routes, layouts, metadata,
server/client components или special files проверьте `node_modules/next/dist/docs/`.

## Feature Structure

```text
features/
  auth/
    api/
    model/
    ui/
    lib/
```

## Shared Code

- Shared utils должны быть маленькими и переиспользуемыми.
- Не создавайте общий `utils.ts` с несвязанными функциями.
- Local utils храните рядом с feature или component.
- Shared UI меняйте только после согласования, если изменение затрагивает несколько экранов.

## Public API

- Индексные файлы допустимы как public API модуля.
- Не экспортируйте внутренние детали feature наружу без необходимости.
- Public API должен оставаться стабильным и понятным.
- При изменении public API проверьте импорты потребителей и не ломайте слой выше без причины.

```ts
export { LoginForm } from './ui/LoginForm'
export type { LoginFormValues } from './model/loginForm.types'
```

## Tests

- Unit-тесты храните рядом с кодом или в `__tests__`, если так уже принято в модуле.
- Используйте `.test.ts`, `.test.tsx`, `.spec.ts` или `.spec.tsx`.
- Покрывайте shared utils и сложную бизнес-логику.
