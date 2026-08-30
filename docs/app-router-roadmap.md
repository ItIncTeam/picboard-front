# App Router: текущая карта

Этот документ описывает только текущую основу роутинга. Не добавляйте сюда подробный дизайн будущих
фич.

Главное правило:

```txt
Сначала route/layout boundaries.
Потом UI.
Потом бизнес-логика.
```

## Что уже есть

```txt
src/app/
  layout.tsx
  not-found.tsx

  (public)/
    layout.tsx
    page.tsx
    auth/
      sign-in/page.tsx
      sign-up/page.tsx
      forgot-password/page.tsx
      create-new-password/page.tsx
      confirm/
        registration/page.tsx
        password-recovery/page.tsx

  (app-shell)/
    layout.tsx
    AppRouteShell.tsx
    @modal/
      default.tsx
      [...catchAll]/page.tsx
      (.)posts/create/page.tsx
    (profile)/
      profile/[userId]/page.tsx
    (protected)/
      layout.tsx
      (main)/
        main/page.tsx
        feed/page.tsx
        messenger/page.tsx
        messenger/[dialogId]/page.tsx
        search/page.tsx
        favorites/page.tsx
        statistics/page.tsx
        profile/[userId]/followers/page.tsx
        profile/[userId]/subscriptions/page.tsx
        settings/layout.tsx
        settings/profile/page.tsx
        settings/account/page.tsx
        settings/devices/page.tsx
        settings/notifications/page.tsx
        posts/create/page.tsx
        posts/[postId]/page.tsx

  (protected)/
    layout.tsx
    admin/
      layout.tsx
      users/page.tsx
      payments/page.tsx
      statistics/page.tsx
      posts/page.tsx
```

Route groups `(public)` и `(protected)` не попадают в URL. Они нужны только для разделения layouts.

## Ответственность layouts

`src/app/layout.tsx` содержит `html`, `body`, metadata, глобальные стили и глобальные providers:

- `ApolloProvider` для GraphQL client context;
- `SessionProvider` для client session state и session bootstrap.

Root layout не содержит route-specific UI, redirects, role checks или бизнес-логику страниц.

`src/app/(public)/layout.tsx` содержит публичный визуальный shell: `PublicHeader` и общий `<main>`.
Здесь нет auth-логики.

`src/app/(app-shell)/layout.tsx` — общий persistent visual shell для Profile и authenticated main
routes. Он владеет единственным `AdaptiveAppShell`: после session bootstrap anonymous Profile
получает public header без Sidebar, а authenticated navigation между `/main`,
`/profile/[userId]` и `/posts/[postId]` сохраняет тот же Header/Sidebar instance. Общий layout не
делает redirect и не превращает Profile в protected route.

`src/app/(app-shell)/(protected)/layout.tsx` оборачивает main-app `children` в
`ProtectedRouteBoundary`. Отдельный `src/app/(protected)/layout.tsx` сохраняет ту же boundary для
admin routes вне app shell.
`ProtectedRouteBoundary` использует client session state из `SessionProvider`:

- `bootstrapping` показывает loading state;
- `anonymous` делает client redirect на `/auth/sign-in?returnTo=<encoded protected path>`;
- `authenticated` рендерит protected content.

Protected layout не читает cookies, не вызывает backend напрямую, не реализует role-based access и
не заменяет middleware.

`returnTo` сохраняет same-app relative path текущего protected route, включая query string. После
входа `/auth/sign-in` валидирует `returnTo`: значение должно начинаться с `/`, не начинаться с `//`
и не начинаться с `/auth`. Небезопасные значения fallback-ятся на `/main`.

`src/app/(app-shell)/layout.tsx` также держит slot `@modal`; protected `(main)` остаётся отдельной
веткой только для auth boundary и route organization. Intercepted Create adapter дополнительно
использует `ProtectedRouteBoundary`, поэтому soft navigation с anonymous Profile не обходит auth.

`/main` — canonical authenticated home. Его `views/main-page` получает текущие `usersCount` и global
`feed` одним Apollo Client operation, чтобы использовать memory-only access token и общий
refresh/retry pipeline. Страница переиспользует общий `RegisteredUsersCounter` и feed-card widgets;
Public Home при этом сохраняет отдельный server/ISR data path. `/feed` пока не имеет отдельного
personalized backend contract и остается compatibility redirect на `/main`; Sidebar также ведет на
`/main`.

`settings/layout.tsx` и `admin/layout.tsx` занимают места под будущие section shells. Пока они
легкие.

## Файлы page.tsx

`page.tsx` должен быть тонким адаптером:

```tsx
import { SignInPage } from '@/views/sign-in-page'

export default function Page() {
  return <SignInPage />
}
```

Не пишите в `page.tsx` формы, запросы, состояние и сложную верстку.

## Публичные auth routes

Текущие auth routes:

```txt
/auth/sign-in
/auth/sign-up
/auth/forgot-password
/auth/create-new-password
/auth/callback
/auth/confirm/registration
/auth/confirm/password-recovery
```

Terms of Service и Privacy Policy показываются на `/auth/sign-up` через `widgets/doc-modal`
(`DocModal`); текст — в `shared/content/legal` (`termsParagraphs`, `privacyParagraphs`, `LegalDocumentBody`).

Auth views используют `AuthViewShell` и собирают реальные формы из `features/auth` для
реализованных auth flows. Временные placeholder views остаются только для еще не завершенных
маршрутов вроде password recovery confirmation.

Подробная карта auth routes, views, features и GraphQL operations находится в
[Auth Routes](./auth/auth-routes.md).

## Widgets

Текущие публичные widgets:

```txt
widgets/public-header
widgets/public-auth-shell
```

`PublicHeader` — верхняя визуальная панель. Пока без dropdown и логики языка.

`PublicAuthShell` — старая легкая рамка для placeholder auth boundaries. Реализованные auth views
используют `AuthViewShell`.

## Modals

Route-based modals живут в `app/(app-shell)/@modal`. Они нужны для контента, который можно
открыть отдельным URL.

Сейчас подключен Create Post modal с Upload, Crop, Filters и Publication steps:

- soft navigation на `/posts/create` внутри `(app-shell)` открывает
  `@modal/(.)posts/create/page.tsx` поверх текущей Main/Profile/Details page;
- прямой заход или reload `/posts/create` рендерит обычный fallback route
  `(protected)/(main)/posts/create/page.tsx`;
- `@modal/default.tsx` и `@modal/[...catchAll]/page.tsx` возвращают `null`, чтобы slot не оставался
  активным на unmatched routes.

Posts sprint planning: [Posts Sprint Overview](./posts-sprint/00-overview.md).

Local UI modals живут рядом с feature или widget. Это confirmations, dropdowns и маленькие dialogs.

Пока не добавляем общий modal manager.

## Public Profile

Route adapter передает реальный dynamic `userId` в `views/profile-page`. View загружает public
`user(id)` и первые 8 `profilePosts`, затем использует `IntersectionObserver` и cursor
`pageInfo.endCursor` для следующих страниц по 8 без frontend sorting или slicing.

Sidebar строит My Profile URL из уже загруженного `SessionProvider.user.id`; отдельный `me` query
для ссылки не выполняется. Owner-only `Profile Settings` определяется сравнением session user id с
route user id.

## Post details

Route adapter передает `postId` в `views/post-details-page`. View загружает существующий `post(id)`,
показывает carousel / description / дату и fallback автора `User`. Owner-only `Edit Post`
определяется сравнением session user id с `PostEntity.ownerId`. Закрытие использует существующий
`getSafeReturnToPath`: явный `?returnTo=`, иначе `/main`. `router.back()` для details не
используется. Сетка профиля передаёт `returnTo=/profile/[userId]` в `PostCard`. Меню `...` одно на
владельца и передаёт соседний `Delete Post` в `DeletePostFlow` без второй проверки владельца;
confirmation, synchronization и redirect остаются внутри delete flow.

## Providers

Не создаем общий provider на весь проект без причины.

Текущие providers:

- `ApolloProvider` — глобально в root layout, потому что auth/session и будущие feature-запросы
  используют общий Apollo client;
- `SessionProvider` — глобально в root layout, чтобы публичные auth views могли синхронизировать
  sign-in с текущей session state, а protected boundary мог читать тот же session context.

Новые providers добавляются только там, где они реально нужны:

- глобальный provider — в root layout, если context нужен across route groups;
- segment provider — в ближайший layout соответствующего route segment;
- локальный provider — рядом с feature или widget.

Если provider пока не нужен, его не добавляем.

## Auth session limitations

Session bootstrap использует `refreshToken` mutation и backend-managed `httpOnly` cookie через
`credentials: include`.

Известное ограничение локальной проверки: production backend выставляет refresh cookie с
`SameSite=Lax`, поэтому localhost не может полноценно проверить F5 restore с production backend.
Полная проверка restore после reload нужна в staging/dev environment на совместимом домене.

## Что не делаем сейчас

- middleware;
- cookie reads в App Router layouts;
- role-based access;
- API calls в layouts;
- формы и validation в `app/`;
- Zustand stores без готового сценария;
- временный UI kit;
- dropdown behavior без задачи.
