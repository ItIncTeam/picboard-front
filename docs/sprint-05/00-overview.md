# Sprint 05: обзор

## Статус

**PARTIAL — аудит 2026-11-11.** Frontend dev `75cf9ff` подтверждён через GitHub.
#194/#195/#197 merged; #196 closed без merge. Полная таблица D1/D2/D3 и следующие PR
для Семёна, Никиты, Ксении и Жени — в [плане задач](./02-frontend-task-breakdown.md#аудит-dev-на-2026-11-11).

Готовы Public Post SSR/modal/cache/edit/delete, Profile UI/grid, Me/session sync,
Edit Profile save wiring и локальные Avatar draft/crop/delete-confirm UI.
Country/City остаются disabled в settings; Avatar не подключён к production pipeline.
Public Profile пока client-only: нет атомарного SSR, metadata и Apollo seed.

Backend dev доступен: Country/City #28 и Avatar upload #27 merged; updateProfile/новый Me
только в open #31, attach/replace только в open #32; delete — пока ticket.
Counters отсутствуют, ordering/cursors profilePosts уже реализованы.
Frontend live-приёмка не подтверждена; прежний общий BACKEND BLOCKED был слишком широким.
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
- Профиль загружается атомарно: пользователь, счётчики и первая страница постов. Неполные данные не
  отображаются и не записываются в кэш.
- Пагинация и polling постов профиля остаются локальными. Публичная страница поста отображается из
  серверных данных и локального состояния.
- Переход к посту из Main или Profile открывает перехваченный маршрут в `@modal`. Прямой URL
  показывает самостоятельную страницу.
- Публичные посты кликабельны в Public Home, Main, Profile и других текущих лентах/сетках. Пост
  ведёт на `/posts/[postId]`, имя и аватар автора — на `/profile/[authorId]`.
- Anonymous, authenticated non-owner и owner видят один публичный контент. `/me` добавляет только
  подтверждённые действия текущего пользователя и владельца; просмотр не требует авторизации.
- Edit Profile и Avatar — независимые возможности. Они используют существующие компоненты и не
  объединяются общей машиной состояний.

## Готово на backend

- `user(id)`, `profilePosts(input)` и `post(id)` доступны без авторизации.
- Отсутствующие user/post возвращают `null`; неизвестный userId для `profilePosts` возвращает
  пустую connection.
- `profilePosts` поддерживает cursor pagination, default `first = 8` и диапазон `1–8`.
- Backend подтвердил 2026-09-11: `User.avatar: File` nullable, `File.url: String!`; frontend
  использует `avatar?.url`, а `avatar === null` — fallback. URL подписанный, действует 15 минут,
  не является постоянным идентификатором и обновляется каждым новым `user`, `feed` или `post`
  запросом с `avatar { url }`; отдельный timer/refresh-manager не нужен.
- `PostEntity` содержит author, ownerId, attachments, `createdAt` и `updatedAt`.
- Live gateway verification 2026-09-19 confirmed the separation: public `User`, private session
  `Me` and auth payload `UserOutput`. `feed.author` and `post.author` are public `User` values and
  expose nullable `avatar { id url }` without private account fields.
- Post attachments имеют signed display URL; наблюдаемый срок — 900 секунд.

## Блокеры backend

- Публичные `publicationsCount`, `followersCount` и `followingCount`.
- Avatar: upload AVATAR уже merged; attach/replace ждут #32, delete ждёт реализации B-4.
- Подтверждение deploy/seed Country/City (код и формат уже доступны в backend dev).
- Live-приёмка реализованной сортировки createdAt DESC, id DESC и cursor semantics `profilePosts`.

### CLOSED: CRITICAL BACKEND / SECURITY

Anonymous `user(id)`, `feed.author` и `post.author` не должны раскрывать `email`,
`isConfirmed`, `confirmationCode`, `confirmationCodeExpDate` и другие приватные auth/account
fields. Live gateway verification 2026-09-19 confirmed that all three surfaces resolve to public
`User`; selecting these private fields is rejected during GraphQL validation.

Временные поля, запросы, мутации, фиктивные счётчики и имитация успешного сохранения запрещены.

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

Женя подключает Country/City по существующему контракту; Ксения сверяет #31 и готовит Avatar
по подтверждённым частям. Семён согласует counters и rollout public User, затем завершает SSR.
Никита принимает готовый Post flow и исправляет только подтверждённые дефекты.
Файлы, зависимости и критерии небольших PR закреплены в основном плане задач.
