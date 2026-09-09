# Sprint 05: обзор

## Статус

**D1.1–D1.2, D3.1 IMPLEMENTED / D1.3 CONTRACT FOUNDATION PARTIAL / BACKEND BLOCKED**

Подтверждены решения 1–38 и пакет backend-задач. D1.1 и D1.2 реализованы. В D1.3 подготовлена
безопасная часть Public User contract foundation; полная атомарная загрузка начальных данных ждёт
backend-контракт счётчиков и безопасный Public User. D3.1 реализована как изолированная RHF-форма;
валидация, Country → City, Privacy Policy trigger и backend-интеграция остаются отдельными задачами.

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
- По live introspection на 2026-09-08 текущий `User.avatar` имеет nullable-тип `File`, а
  `File.url` — тип `String!`; отдельного `User.avatarUrl` в актуальной схеме нет. Это снимок
  текущего контракта, а не утверждение об истории предыдущих контрактов.
- `PostEntity` содержит author, ownerId, attachments, `createdAt` и `updatedAt`.
- Post attachments имеют signed display URL; наблюдаемый срок — 900 секунд.

## Блокеры backend

- Поля профиля, их типы и обязательность; операции чтения и сохранения; формат ошибок.
- Публичные `publicationsCount`, `followersCount` и `followingCount`.
- Назначение загрузки аватара и операции установки, замены и удаления.
- Источник и формат значений Country/City.
- Гарантированная сортировка и cursor semantics `profilePosts`.

### CRITICAL BACKEND / SECURITY

Anonymous `user(id)`, `feed.author` и `post.author` не должны раскрывать `email`,
`confirmationCode`, `confirmationCodeExpDate` и другие приватные auth/account fields. Live gateway
сейчас возвращает эти поля без авторизации. Исправление имеет первый приоритет и не ограничивается
Sprint 05.

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
- [Style Guide](../style_guide_full.md), [Architecture](../architecture.md),
  [Layer Ownership](../layer-ownership.md), [App Router Roadmap](../app-router-roadmap.md) — общие
  правила проекта.

## Следующий шаг

Подготовить короткое сообщение и конкретные задачи для backend-команды. Независимые frontend-задачи
Edit Profile и Avatar можно начинать без ожидания backend; production integration ждёт готовых
контрактов.
