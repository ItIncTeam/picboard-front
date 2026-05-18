# Code Style

Основной источник правил: [Picboard Frontend Style Guide](./style_guide_full.md). Этот файл
расшифровывает правила для кода и не должен им противоречить.

## Naming

- Используйте понятные имена без сокращений.
- Не используйте однобуквенные переменные, кроме коротких локальных callback-аргументов.
- Не используйте `_` в именах переменных и функций.
- Не добавляйте цифры в названия без реальной доменной причины.
- Используйте `camelCase` для переменных, функций, utils и selectors.
- Используйте `PascalCase` для React-компонентов и component files.
- Используйте `UPPER_CASE` только для настоящих констант.

```ts
// Bad
const n = 'Ivan'
const foo = false
const start_week = 'Sunday'

// Good
const userName = 'Ivan'
const appInitialized = false
const startOfWeek = 'Sunday'
```

## Files

| Type      | Convention      | Example                   |
| --------- | --------------- | ------------------------- |
| Component | `PascalCase`    | `UserCard.tsx`            |
| Slice     | `camelCase`     | `appSlice.ts`             |
| Selector  | `camelCase`     | `appSelectors.ts`         |
| Utils     | `camelCase`     | `handleServerAppError.ts` |
| Hooks     | `useCamelCase`  | `useDebounce.ts`          |
| API       | `camelCase`     | `authApi.ts`              |
| Tests     | dot.case suffix | `authSlice.test.ts`       |
| Storybook | dot.case suffix | `SignIn.stories.tsx`      |
| Types     | dot.case suffix | `authApi.types.ts`        |

Избегайте безымянных `index.tsx` для компонентов. Индексные файлы допустимы как public API слоя.

## TypeScript

- Предпочитайте `unknown` вместо `any`.
- Явно типизируйте возвращаемое значение у shared utils, hooks и публичных функций.
- Используйте `User[]`, а не `Array<User>`.
- По умолчанию используйте `type`; `interface` применяйте только при реальной необходимости.
- Для nullable-значений используйте общий helper `Nullable<T>`.
- Не используйте wrapper-типы `String`, `Boolean`, `Number`.
- Не используйте `const enum`; предпочитайте `as const` objects.

```ts
export type Nullable<T> = T | null

const direction = {
  Down: 'DOWN',
  Up: 'UP',
} as const

type Direction = (typeof direction)[keyof typeof direction]
```

## React

- Не используйте `React.FC`.
- Один основной компонент — один файл.
- Деструктурируйте props в аргументах компонента.
- Если wrapper не нужен, используйте fragment.
- Сложные выражения выносите в именованные переменные.
- Не злоупотребляйте `useMemo` и `useCallback`; оптимизация должна быть обоснована.
- Если логика компонента становится большой, выносите ее в custom hook.

```tsx
type Props = {
  message: string
}

export const Message = ({ message }: Props) => {
  return <p>{message}</p>
}
```

## Component Structure

```tsx
import { useMemo } from 'react'

type Props = {
  value: string
}

const MAX_LENGTH = 100

export const Component = ({ value }: Props) => {
  const trimmedValue = useMemo(() => value.slice(0, MAX_LENGTH), [value])

  return <div>{trimmedValue}</div>
}
```

## Imports And Exports

- Используйте path aliases из `tsconfig.json`.
- Избегайте default exports.
- Используйте named exports для компонентов, hooks, utils и model-кода.
- Default export допустим для Next.js special files, framework configs, `React.lazy` и library API,
  если этого требует инструмент. Для Next.js special files сначала проверьте
  `node_modules/next/dist/docs/`.

```ts
export { useDebounce } from './useDebounce'
export { useLocalStorage } from './useLocalStorage'
```

## Comments

- Комментарии должны объяснять сложную логику, а не очевидные строки.
- Пишите комментарии на английском.
- Используйте JSDoc для сложных shared helpers.
- Не оставляйте закомментированный код.

```ts
/**
 * Handles network errors from the server and maps them to app-level notifications.
 */
export const handleServerNetworkError = (error: unknown): void => {}
```

## Code Review Checklist

- [ ] Имена понятны и соответствуют convention.
- [ ] Нет `any`, если можно использовать безопасный тип.
- [ ] Props типизированы и деструктурированы.
- [ ] Сложные условия вынесены в переменные.
- [ ] Нет закомментированного кода.
- [ ] Используются named exports.
- [ ] Код проходит `pnpm check`.
