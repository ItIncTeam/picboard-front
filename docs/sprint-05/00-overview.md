# Sprint 05: обзор

## Статус

**PARTIAL — актуализировано на 2026-11-14.** Frontend dev `75cf9ff`, backend dev `3b151ac`.
#194/#195/#197 merged; #196 closed без merge. Полная таблица D1/D2/D3 и следующие PR
для Семёна, Никиты, Ксении и Жени — в [плане задач](./02-frontend-task-breakdown.md#аудит-dev-на-2026-11-14).

Готовы Public Post SSR/modal/cache/edit/delete, canonical Close/Delete fallback в профиль владельца
(D2.7 — FRONT-177, #191), Profile UI/grid, Me/session sync,
Edit Profile save wiring и локальные Avatar draft/crop/delete-confirm UI.
Country/City остаются disabled в settings; Avatar не подключён к production pipeline.
Public Profile пока client-only: нет атомарного SSR, metadata и Apollo seed.

В backend dev merged: Country/City #28, Avatar upload #27, updateProfile/новый Me #31,
setProfilePhoto #32, deleteProfilePhoto #34 и nullable Post.author #35.
Public User уже использует aboutMe вместо удалённого bio; frontend ещё запрашивает bio.
Для nullable author/fallback/partial responses нужна отдельная задача совместимости D2.8.
Counters недоступны: временно показывать «—», без блокировки Profile SSR.
Ordering/cursors profilePosts реализованы. Production rollout и frontend live-приёмка не подтверждены.
Детали, источники и вопросы — в [контракте](./07-backend-contract.md).

## Цель

Реализовать редактирование профиля и аватара, публичный профиль с постами и публичную страницу
поста. Публичные страницы должны работать через SSR, а после hydration продолжать работу с
существующим Apollo Client без повторного начального запроса.

## Архитектура

- `/profile/[userId]` и `/posts/[postId]` доступны без авторизации и формируют свежие начальные
  данные на каждый HTTP-запрос через `cache: 'no-store'`.
- Сервер передаёт полные сериализуемые данные. Локальная клиентская граница записывает их в
  существующий Apollo Client; новый клиент или слой состояния не создаётся.
- Профиль загружается атомарно: пользователь и первая страница постов. Недоступные счётчики
  отображаются как «—» только в UI, не запрашиваются и не подменяются данными в Apollo.
  Обязательные данные проверяются; nullable author и допустимые partial responses — по решению 30.
- Пагинация и polling постов профиля остаются локальными. Публичная страница поста отображается из
  серверных данных и локального состояния.
- Переход к посту из Main или Profile открывает перехваченный маршрут в `@modal`. Прямой URL
  показывает самостоятельную страницу.
- Публичные посты кликабельны в Public Home, Main, Profile и других текущих лентах/сетках. Пост
  ведёт на `/posts/[postId]`, имя и аватар существующего автора — на `/profile/[authorId]`.
  При `author: null` нужен fallback без ссылки на несуществующего автора.
- Anonymous, authenticated non-owner и owner видят один публичный контент. `/me` добавляет только
  подтверждённые действия текущего пользователя и владельца; просмотр не требует авторизации.
- Edit Profile и Avatar — независимые возможности. Они используют существующие компоненты и не
  объединяются общей машиной состояний.

## Реализовано в backend dev (production rollout не подтверждён)

- `user(id)`, `profilePosts(input)` и `post(id)` доступны без авторизации.
- Отсутствующие user/post возвращают `null`; неизвестный userId для `profilePosts` возвращает
  пустую connection.
- `profilePosts` поддерживает cursor pagination, default `first = 8` и диапазон `1–8`.
- `User.avatar` nullable. Для `File.url` в dev расходятся `@Field()` и nullable `ResolveField`;
  точная nullability требует composed SDL. Signed URL служит только для отображения;
  исторически наблюдался TTL 900 секунд, текущий gateway не проверен. Timer/refresh-manager не добавляется.
- `PostEntity` содержит nullable author, ownerId, attachments, `createdAt` и `updatedAt`.
- `updateProfile` возвращает `Me`; Public User использует `aboutMe`, без приватных account fields.
- Avatar: `initiateUploadBatch` с AVATAR → PUT → `completeUpload` (READY) →
  `setProfilePhoto(fileId: ID!): User!`; удаление — `deleteProfilePhoto: Boolean!` без аргументов.
  После Avatar mutations отдельно синхронизируются Me/session и публичный User.
- Live gateway verification 2026-09-19 confirmed the separation: public `User`, private session
  `Me` and auth payload `UserOutput`. `feed.author` and `post.author` are public `User` values and
  expose nullable `avatar { id url }` without private account fields.
- Post attachments имеют signed display URL; наблюдаемый срок — 900 секунд.

## Оставшиеся зависимости и приёмка

- Реальные `publicationsCount`, `followersCount` и `followingCount` — будущая интеграция;
  временное UI «—» позволяет завершать SSR без них.
- Avatar: frontend pipeline и синхронизация, export-параметры и подтверждение rollout #27/#32/#34.
- Подтверждение deploy/seed Country/City (код и формат уже доступны в backend dev).
- Live-приёмка реализованной сортировки createdAt DESC, id DESC и cursor semantics `profilePosts`.

### CLOSED: CRITICAL BACKEND / SECURITY

Anonymous `user(id)`, `feed.author` и `post.author` не должны раскрывать `email`,
`isConfirmed`, `confirmationCode`, `confirmationCodeExpDate` и другие приватные auth/account
fields. Live gateway verification 2026-09-19 confirmed that all three surfaces resolve to public
`User`; selecting these private fields is rejected during GraphQL validation.

Временные GraphQL fields/mutations, фиктивные числовые счётчики и имитация успеха запрещены.
UI «—» означает отсутствие данных, не ноль и не длину страницы.

## Решения продукта

Не входят в реализацию без отдельного подтверждения и готового backend-контракта:

- списки Followers и Following;
- Follow и Unfollow.

За пределами Sprint 05 остаются удаление подписчика, Send Message, comments, replies, likes и
engagement controls. Наличие этих элементов в Figma не расширяет объём спринта.

## Документы

- [Журнал решений](./01-decisions.md) — подтверждённые архитектурные решения.
- [План frontend-задач](./02-frontend-task-breakdown.md) — основной документ для выполнения.
- [Backend-контракт профиля](./07-backend-contract.md) — источник правды для D1.7/D1.8.
- [Style Guide](../style_guide_full.md), [Architecture](../architecture.md),
  [Layer Ownership](../layer-ownership.md), [App Router Roadmap](../app-router-roadmap.md) — общие
  правила проекта.

## Следующий шаг

Женя подключает Country/City; Ксения сверяет validation/errors #31 и подключает Avatar с отдельной
синхронизацией Me/User. Семён исправляет Public User selection и завершает SSR с counters «—».
Никита выполняет отдельную задачу nullable author/fallback/partial responses и принимает готовый Post flow.
Перечитывание Me перед Edit Profile submit остаётся OPEN UX decision.
Файлы, зависимости и критерии небольших PR закреплены в основном плане задач.
