# Architecture

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
ответственности слоев остаются теми же.

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

```ts
export { LoginForm } from './ui/LoginForm'
export type { LoginFormValues } from './model/loginForm.types'
```

## Tests

- Unit-тесты храните рядом с кодом или в `__tests__`, если так уже принято в модуле.
- Используйте `.test.ts`, `.test.tsx`, `.spec.ts` или `.spec.tsx`.
- Покрывайте shared utils и сложную бизнес-логику.
