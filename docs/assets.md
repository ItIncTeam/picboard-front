# Assets

Этот документ фиксирует правила импорта изображений и SVG в Picboard frontend.

## SVG как React-компонент

Использовать для:

- иконок;
- UI-графики;
- элементов интерфейса, которым нужны props, className, размеры или цвет.

Пример:

```tsx
import { SearchIcon } from '@/shared/assets'

export const Example = () => {
  return <SearchIcon />
}
```

Новые SVG-иконки добавлять в:

```txt
src/shared/assets/icon
```

После добавления экспортировать иконку через публичный API:

```ts
export { default as SearchIcon } from './search.svg?react'
```

Компоненты приложения должны импортировать иконки только из `@/shared/assets`.

## SVG как изображение

Если SVG нужен как обычный файл изображения, использовать обычный import asset.

Пример:

```ts
import logo from './logo.svg'
```

Такой импорт возвращает обычный asset, а не React-компонент. Не используйте его как JSX-компонент.

## PNG/JPG/WebP

Использовать через Next Image:

```tsx
import Image from 'next/image'
import { RuFlagImage } from '@/shared/assets'

export const Example = () => {
  return <Image src={RuFlagImage} alt="Russian" />
}
```

Новые изображения хранить в соответствующих папках `src/shared/assets` и экспортировать через
barrel-файлы.

## Правила проекта

- Не импортировать `*.svg?react` напрямую из компонентов.
- Использовать публичный API из `@/shared/assets`.
- Для иконок использовать SVG React components.
- Для фотографий, флагов и контентных изображений использовать PNG/JPG/WebP + Next Image.
- Не создавать альтернативные способы импорта SVG без отдельного архитектурного решения.

## Почему используется `?react`

В проекте SVG поддерживаются в двух режимах:

- `*.svg` — обычный asset-файл;
- `*.svg?react` — React-компонент через SVGR.

Такое разделение необходимо для корректной работы одновременно в:

- Next.js;
- Storybook (Vite);
- next/image;
- SVGR.

Благодаря этому SVG-иконки работают как React-компоненты, а обычные SVG-файлы остаются изображениями.

## Добавление новой SVG-иконки

1. Поместить файл в:

```txt
src/shared/assets/icon
```
