# Sprint 05: план frontend-задач

Статус на 2026-11-11: **спринт PARTIAL**. Аудит ниже уточняет реализацию и backend-зависимости; DONE означает наличие кода, а не live-приёмку.

Основные решения находятся в [Decision Log](./01-decisions.md). Здесь перечислены только задачи
команды. Каждая рассчитана примерно на 1–2 рабочих дня и должна завершаться своими тестами.

## Аудит dev на 2026-11-11

Источники: frontend dev `75cf9ffdf94f98f4c1b8c4d63e24efb4f0a455d5` (совпадает с локальным HEAD),
backend dev `eafa64dd05ba291156642ea97c380d593de04d08`. GitHub API и код прочитаны;
тесты, сборка, lint/typecheck и live mutations не запускались. Старые результаты проверок ниже —
исторические отчёты, не результаты этого аудита. Работа стенда и актуальный composed SDL не подтверждены.

[Frontend PR #194](https://github.com/ItIncTeam/picboard-front/pull/194) merged 27 октября,
[#195](https://github.com/ItIncTeam/picboard-front/pull/195) merged 28 октября,
[#197](https://github.com/ItIncTeam/picboard-front/pull/197) merged 5 ноября.
[#196](https://github.com/ItIncTeam/picboard-front/pull/196) **closed, not merged** 6 ноября.
Единственный открытый frontend PR — [#192 Deploy](https://github.com/ItIncTeam/picboard-front/pull/192),
`dev → main`; это не отдельная реализация Sprint 05. История merged #169–#197 сверена с текущим кодом.

### Статусы всех задач

| Задача | Статус      | Доказательство и остаток                                                                                                                                            |
| ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1.1   | DONE        | `views/profile-page/ProfileHeader.tsx`: props UI, counters, owner settings; #171/#174. Рабочий ProfilePage пока дублирует шапку без counters; подключение — D1.4.   |
| D1.2   | DONE        | `ProfilePage.tsx` → `PostGrid` с canonical href и returnTo; #172/#184.                                                                                              |
| D1.3   | PARTIAL     | `entities/user/api/usersApi.ts`: безопасный User/avatar; #173/#178/#189. Нет общей operation, server loader, counters и InitialProfileData.                         |
| D1.4   | PARTIAL     | Route adapter передаёт только userId; `ProfilePage` — client component с getUser в effect. Есть error boundary (#180), но нет Profile SSR/metadata/server notFound. |
| D1.5   | NOT STARTED | Нет Profile seed/baseline/skipToken; текущий useQuery стартует на клиенте. Post seed не закрывает эту задачу.                                                       |
| D1.6   | PARTIAL     | `ProfilePage.tsx`: fetchMore, history, pollInterval 60000, защита request/revision; нет сброса по SSR baseline. Backend ordering уже реализован, см. контракт.      |
| D1.7   | DONE        | #194: `entities/user/api/currentUserApi.ts`, session CurrentUser/Me. Совместимость со стендом не проверена; новый Me пока в backend #31.                            |
| D1.8   | DONE        | #195: updateProfile no-cache и guarded synchronizer в session-management. Live сохранение не подтверждено.                                                          |
| D2.1   | DONE        | #169: публичный `/posts/[postId]`, без protected boundary.                                                                                                          |
| D2.2   | DONE        | #175: `views/post-details-page/api/loadInitialPost.ts`, getPostQueryData, baselineKey.                                                                              |
| D2.3   | DONE        | #175: canonical route, cached loader/metadata, server rendering, ошибки и notFound.                                                                                 |
| D2.4   | DONE        | #181: `@modal/(.)posts/[postId]`, back/локальные ошибки.                                                                                                            |
| D2.5   | DONE        | #184: PostCard/PublicPostCard/PublicPostsGrid canonical Links, отдельные carousel controls.                                                                         |
| D2.6   | DONE        | #186/#191: `useSeedPostDetailsCache`, displayPost, edit/delete cache и выход к owner.                                                                               |
| D3.1   | DONE        | #176/#197: `features/edit-profile/ui/EditProfileForm.tsx`, RHF/reset/submit/DocModal.                                                                               |
| D3.2   | DONE        | #182/#193/#197: validation, UTC age, календарная DOB, DatePicker.                                                                                                   |
| D3.3   | PARTIAL     | Props-зависимость Country → City есть; `ProfileSettingsPage.tsx` передаёт locationDisabled, справочник/поиск не подключены. Backend lookup уже merged #28.          |
| D3.4   | DONE        | #185: `edit-profile-avatar/model/useAvatarDraft.ts`, MIME/10 MiB/preview/cleanup.                                                                                   |
| D3.5   | DONE        | #187: AvatarCropper + candidate/decode/квадратные координаты, без export/upload.                                                                                    |
| D3.6   | DONE        | #188: AvatarDeleteConfirm и injected OnDeleteAvatar, pending/retry. Production delete сюда не входит.                                                               |
| D3.7   | PARTIAL     | #197: `views/settings-page/ProfileSettingsPage.tsx`, реальный submit и session sync. Lookup disabled; live API требует подтверждения backend #31.                   |
| D3.8   | BLOCKED     | Нет production Avatar pipeline/композиции в settings. Upload есть на backend dev, attach/replace только open #32, delete пока ticket B-4.                           |

### Что брать из #196

Не переносить PR целиком и не открывать второй PR на интеграцию Edit Profile: route/view,
prefill, updateProfile, mapper, field errors и reset уже реализованы #197. В dev также уже есть
browser coverage backend errors/underage/privacy/retry в `ProfileSettingsPage.browser.test.tsx`.

Полезный отсутствующий фрагмент: `profileFormMapper.ts` из #196 проверяет формат YYYY-MM-DD и
реальную календарную дату (round-trip year/month/day); dev `getEditProfileValues` просто делает
slice(0, 10) + Date. Это кандидат на точечный перенос **только при подтверждении формата DOB**:
проверка invalid DOB и её тест отсутствуют в dev. Не заменять mapper целиком: вариант #196 всегда
передаёт optional поля и может очистить неизменённые данные; #197 использует dirtyFields.
Рекурсивный сборщик ошибок #196 и новый `views/settings-profile-page` не переносить: они дублируют
текущий API/`views/settings-page`; #197 уже обрабатывает подтверждённые коды и stale session.
Тесты #196 с plain object errors не копировать вместо реального CombinedGraphQLErrors.

### Оставшаяся работа и следующие PR

P0 — сначала, P1 — после указанных зависимостей. Пути ниже закреплены за одним владельцем.
Не создавать PR только ради загрузки разработчика: Posts уже реализованы.

| Разработчик | Приоритет / следующий небольшой PR                                                                                                      | Файлы (исключительное владение)                                                                                                                                                    | Зависимости и критерии готовности                                                                                                                                                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Семён       | P0: сверить Public User после backend #31; P1: D1.3 loader                                                                              | `entities/user/api/usersApi.ts`, `views/profile-page/api/*`                                                                                                                        | До смены bio → aboutMe получить целевой SDL/дату rollout #31. Loader после counters: один anonymous no-store POST, полный User+counters+posts, null отдельно от technical error, baselineKey. Не выдумывать counters.                                                                                                                                                       |
| Семён       | P1: D1.4–D1.5 SSR + seed; затем отдельный D1.6 continuation                                                                             | `views/profile-page/*`, `app/(app-shell)/(profile)/profile/[userId]/*`                                                                                                             | После loader: HTML гостю, page/metadata один fetch, server 404, retry; затем seed без initial browser fetch; baseline reset, polling/fetchMore сохраняют историю и локальные ошибки. Shared PostCard не менять.                                                                                                                                                             |
| Никита      | P0: приёмка D2.1–D2.6; PR только на воспроизводимый дефект                                                                              | `views/post-details-page/*`, `widgets/post-details-modal/*`, `entities/post/*`, существующие PostCard/PublicPostCard/PublicPostsGrid                                               | Direct/reload SSR, soft modal, back/forward, edit/delete/cache, guest/owner. Если backend подтвердит новый author contract, отдельный узкий PR selection/types. Не переписывать Posts и не брать Profile pagination; общий upload API менять только после согласования с Ксенией.                                                                                           |
| Ксения      | P0: узкая сверка Edit Profile с backend #31 (DATE_IN_FUTURE, DOB); P1: Avatar export/upload, затем отдельный attach/replace и delete PR | `features/edit-profile/model/editProfileErrors*`, `editProfileValues*`, `features/edit-profile-avatar/*`, `entities/user/api/currentUserApi.ts` и `current-user.ts`                | Не повторять #196/#197. DATE_IN_FUTURE в актуальном #31 отсутствует в frontend field-code mapping. Export только после согласования размеров/MIME. Upload AVATAR начинается по Save, READY до attach. Attach после #32/rollout; delete только после реальной mutation/payload. Не синтезировать Me из Public User payload.                                                  |
| Женя        | P0: D3.3 lookup API и async Country/City UI; затем отдельный PR wiring settings                                                         | `entities/user/api/locationApi.ts` (предлагаемый), `features/edit-profile/ui/*`, `features/edit-profile/model/types.ts`, `features/edit-profile/index.ts`, `views/settings-page/*` | Backend #28 уже merged: countries cache, cities debounce около 250 ms, loading/error/retry, reset City при смене Country, игнорировать старые ответы, сохранить selected prefill вне результатов поиска. Wiring сохранения после подтверждения #31: оба ID/null и dirty semantics, без нового Me. Avatar добавляет в settings только Женя после готового public API Ксении. |

Ксения не меняет EditProfileForm/types/index и settings параллельно с Женей; Семён не меняет
currentUserApi/session, а использует существующий synchronizer. Если понадобится изменение session,
его делает Семён отдельным последовательным PR после API Ксении, без параллельного редактирования.
Документы спринта синхронизирует Семён после merge. Все — aliases между модулями, relative внутри,
route adapter в app, композиция в views, без feature-to-feature imports и API в widgets.

**Backend-independent:** сохранить узкие границы UI/API Country/City, реализовать поиск по уже
доступному контракту #28; приёмка текущего Post; точечные подтверждённые ошибки Edit Profile.
Не создавать второй form mapper или общий coordinator Avatar+RHF.

**Backend-dependent:** live Me/updateProfile и location submit (#31), Public User migration,
D1.3–D1.5 (counters), финальная D1.6 приёмка cursor/polling на целевом стенде,
Avatar export-параметры/PUT headers, attach/replace (#32), delete (B-4) и cache/session integration.
До подтверждения не включать несуществующие mutations, fake success, нулевые counters,
новые follow/likes/comments, refresh-token после смены username или новый Apollo Client.

## Общие правила

- Public Profile и Public Post доступны гостю без `/me`, access token и auth guard.
- `/me` остаётся client-only и добавляет только разрешённые действия текущего пользователя.
- Public Home, Main и Profile открывают пост через canonical `/posts/[postId]`; внутри приложения
  маршрут может быть перехвачен существующим `@modal`.
- Основной способ возврата из перехваченного Post — `router.back()`. Очищенный `returnTo`
  используется только как запасной путь.
- Не добавлять fake API, временные GraphQL fields/mutations и фиктивные успешные ответы.
- Не расширять Sprint 05 за счёт Followers/Following, Follow/Unfollow, comments, replies, likes и
  engagement controls.
- Сначала использовать существующие UI-компоненты и локальные архитектурные границы.

## Backend-зависимости

**CRITICAL BACKEND / SECURITY CLOSED 2026-09-19:** anonymous `user(id)`, `feed.author` и
`post.author` подтверждены как public `User`; приватные auth/account fields отсутствуют и
отклоняются GraphQL validation.

Frontend-интеграции также ждут:

- `publicationsCount`, `followersCount`, `followingCount`;
- Avatar upload/attach/replace/delete contract;
- rollout/seed Country/City на целевом gateway (код уже merged backend #28);
- приёмка реализованных ordering/cursors на целевом gateway (код уже подтверждён).

Контракт чтения/сохранения Edit Profile доступен в
[07-backend-contract.md](./07-backend-contract.md) — источник правды для D1.7/D1.8.
Синхронизация `Me` реализована в D1.7; API и синхронизация `updateProfile` реализованы в D1.8.
Settings и submit UX формы подключены в D3.7; async Country/City lookup остаётся отдельной зависимостью.

Backend подтвердил 2026-09-11: `User.avatar: File` nullable, `File.url: String!`; frontend
использует `avatar?.url`, а `avatar === null` — fallback. URL подписанный, действует 15 минут и не
является постоянным идентификатором. Каждый новый `user`, `feed` или `post` запрос с
`avatar { url }` возвращает свежий URL, поэтому отдельный timer/refresh-manager не нужен.

Ошибки для неверного `first` или cursor желательно улучшить, но это не блокирует Profile SSR.

## Исходное деление задач (актуальные владельцы — в таблице аудита)

- **Dev 1:** Public Profile, его SSR, Apollo continuation и локальная пагинация.
- **Dev 2:** Public Post, маршруты, общие ссылки карточек и синхронизация Post mutations.
- **Dev 3:** Edit Profile, Avatar и их отдельные backend-интеграции.

Dev 2 меняет общее Link-поведение `PostCard`, `PublicPostCard` и `PublicPostsGrid`. Dev 1
подключает готовое поведение в Profile и не дублирует его. Public User и Edit Profile используют
разные типы на своих границах до появления подтверждённого общего backend-типа.

---

## Dev 1 — Public Profile

### D1.1. Public Profile UI

**Цель:** собрать публичную шапку профиля и состояния страницы из готовых props.

**Объём:** аватар, username, имя, описание, счётчики, Profile Settings для владельца и адаптивная
композиция. Сетевые запросы и backend DTO не входят.

**Оценка:** 1–2 дня.
**Сложность:** Средняя.
**Зависит от backend:** Нет.

**Готово:** UI работает для гостя, авторизованного пользователя и владельца; публичный контент
одинаков, а элементы владельца появляются только после клиентского `/me`; используются
существующие компоненты и контрольные точки.

**Основные проверки:** пустые необязательные поля, длинные username и описание, счётчики,
адаптивная вёрстка, отсутствие элементов владельца до подтверждения его ID.

**FRONT-176:** loading skeleton рабочего `ProfilePage` сохраняет круглую геометрию Avatar,
использует line-height tokens для текстовых полос и ту же секцию Publications с заголовком,
разделителем и отступом перед сеткой. Placeholder счётчиков не добавлен: рабочая страница пока
их не отображает. PostGrid shimmer не изменён; новые анимации не добавлены.

### D1.2. Profile post grid и переход к посту

**Цель:** подключить сетку постов профиля к общей публичной навигации.

**Объём:** `PostGrid`, пустое состояние, загрузка, ошибка и проверка ссылок на уровне маршрута.
Общие `PostCard` Link-правила принадлежат Dev 2.

**Оценка:** 1 день.
**Сложность:** Простая.
**Зависит от backend:** Нет; финальная проверка модального окна зависит от D2.4 и D2.5.

**Готово:** каждый пост профиля ведёт на `/posts/[postId]`; переход доступен гостю; Profile не
добавляет императивную навигацию и не меняет кнопки карусели.

**Основные проверки:** canonical href, открытие перехваченного Post внутри приложения, обычное
поведение Link и отсутствие дублирования Link-логики в Profile.

### D1.3. Начальные данные Public Profile

**Статус:** часть Public User contract foundation синхронизирована с текущей формой
`User.avatar`, безопасным Public User и подтверждёнными правилами signed URL. Общая Profile
operation, server loader и полный `InitialProfileData` не реализованы и ждут публичные счётчики.
Рабочий `ProfilePage` отображает `user.avatar?.url` через Next/Image; при null Avatar сохраняется
`PersonIcon` fallback. Signed URL используется только для отображения, без таймеров обновления.

**Цель:** получить пользователя, счётчики и первую страницу `profilePosts` одним GraphQL POST.

**Объём:** общая GraphQL operation, фабрика переменных без `after`, прямой `fetch` с
`cache: 'no-store'`, строгая проверка полного ответа и сериализуемый `InitialProfileData`.

**Оценка:** 2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Да — публичные счётчики.

**Готово:** один запрос возвращает полный набор или классифицированную ошибку; `user === null`
означает отсутствие пользователя; неполный ответ не отображается и не попадает в Apollo Client;
успешная загрузка создаёт `baselineKey`.

**Основные проверки:** число запросов, переменные, HTTP/transport, неверный JSON, GraphQL errors,
отсутствующие счётчики или посты, `user: null` и полный ответ с нужными `id/__typename`.

### D1.4. Public Profile SSR, metadata и ошибки маршрута

**Цель:** перевести `/profile/[userId]` на атомарный публичный SSR.

**Объём:** Server Component, общий `React.cache()` loader для page и `generateMetadata()`,
`notFound()`, локальный `error.tsx` с `unstable_retry()`. `loading.tsx` и Suspense не
добавляются.

**Оценка:** 2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Да; зависит от D1.3.

**Готово:** гость получает полный HTML; metadata не создаёт второй запрос; Retry выполняет новую
загрузку с `cache: 'no-store'` и создаёт новый baseline; технические детали ошибки не показываются.

**Основные проверки:** SSR HTML, корневая 404, локальная ошибка, Retry, страница и metadata за один
запрос, свежие данные в следующем HTTP request.

### D1.5. Apollo continuation профиля

**Цель:** продолжить работу профиля после hydration без второго начального запроса.

**Объём:** локальное заполнение Apollo Client через `useApolloClient()`, `writeQuery` в
`useEffect`, `seededBaselineKey`, `skipToken` и запасные server props для пользователя и
счётчиков.

**Оценка:** 1–2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Да; зависит от D1.3 и формы live Public User и счётчиков.

**Готово:** первое клиентское отображение совпадает с SSR; старый cache не читается до заполнения
для текущего baseline; `cache-first` не создаёт запрос из браузера; неполный cache не заменяет
серверные данные.

**Основные проверки:** hydration, StrictMode, повторный effect, новый userId, `router.refresh()`,
неполный cache и отсутствие запроса из браузера.

### D1.6. Pagination и polling после SSR

**Цель:** сохранить текущую cursor pagination и polling поверх первой страницы из SSR.

**Объём:** `fetchMore`, локальная история, сверка первой страницы, `pollInterval: 60_000` и сброс
по `userId + baselineKey`.

**Оценка:** 2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Частично — реализацию можно начать, завершение ждёт гарантий сортировки и
cursor.

**Готово:** polling обновляет первую страницу и сохраняет историю; изменившаяся цепочка cursor
сбрасывает локальную версию; ошибки polling и `fetchMore` остаются локальными.

**Основные проверки:** `fetchMore`, успех/ошибка/повтор polling, вытесненные посты, новая цепочка
cursor, Profile A → B и `router.refresh()`.

---

### D1.7. Синхронизация Me с profile read-model

**Статус:** IMPLEMENTED; focused auth tests и статические проверки прошли без live backend.

`features/auth/session-management` запрашивает полный `Me` из раздела 7
[backend-контракта](./07-backend-contract.md). `CurrentUser` использует `aboutMe`,
nullable поля профиля и простые типы Country/City. Поле `bio` удалено без alias.
Bootstrap `refreshToken` → `getMe`, access token, refresh queue и logout не изменены.
Существующие session API tests и SessionProvider mock синхронизированы с новым типом.
`updateProfile` и загрузка/удаление аватара в D1.7 не входят.

Проверка D1.7 при недоступном backend:

- `pnpm exec vitest run --project unit --project browser src/features/auth src/shared/api/apollo/links/tests src/shared/lib/auth`
  — 26 файлов, 113 тестов прошли; Apollo/session API замоканы.
- `pnpm lint`, `pnpm lint:styles`, `pnpm format:check`, `pnpm typecheck` — прошли.
- Me tests проверяют точный selection из раздела 7 backend-контракта, nullable profile/location
  values, отсутствующий payload и отклонённые запросы. SessionProvider tests проверяют bootstrap,
  дедупликацию refresh, порядок token → Me, sign-in sync, stale bootstrap, expiration и logout
  при успешном и неуспешном backend-ответе.
- Точные output SDL/nullability остаются неподтверждёнными; TypeScript сохраняет conservative null.
  Production build, live `me` и cookie/session flow ждут восстановления backend.

---

### D1.8. Синхронизация CurrentUser после updateProfile (FRONT-178)

**Статус:** IMPLEMENTED; verification uses mocks, backend unavailable.

`updateProfile` API и синхронизация Me cache/session реализованы по
[backend-контракту](./07-backend-contract.md). Callback захватывается **до** mutation;
старые callbacks и повторные вызовы после успешной синхронизации отбрасываются.
API, FSD-границы и пример использования: [Session Architecture](../auth/auth-session-architecture.md#profile-update-synchronization-front-178--d18).
Settings, submit UX и avatar mutations остаются вне D1.8.

Проверки: focused API/auth/browser suite (28 файлов, 142 теста), lint, stylelint,
format check и typecheck прошли. Tests покрывают cache/session sync, nullable/cleared fields,
ошибки mutation, logout/expiration, user switch, bootstrap/refresh guards и stale callbacks.
`pnpm test`: 691 passed, 6 failed и 1 suite import error; те же сбои воспроизведены на `dev`
(PublicHome DOM assertions, PostDetails test без ApolloProvider, browser Next/Link import).
Production build и live cookie/session flow не запускались.

---

## Dev 2 — Public Post и навигация

### D2.1. Публичная структура маршрута Post

**Цель:** убрать проверку авторизации с просмотра `/posts/[postId]`.

**Объём:** перенести canonical route прямо под `(app-shell)`, сохранить защищённый Create Post,
тонкие адаптеры маршрута и обновить `docs/app-router-roadmap.md`.

**Оценка:** 1 день.
**Сложность:** Средняя.
**Зависит от backend:** Нет; live `post(id)` уже доступен гостю.

**Готово:** гость открывает `/posts/[postId]` напрямую и после перезагрузки; просмотр не ведёт на
sign-in; элементы владельца по-прежнему зависят от клиентского `/me`.

**Основные проверки:** дерево маршрутов, гостевой просмотр и перезагрузка, защищённый Create Post,
отсутствие `ProtectedRouteBoundary` вокруг Public Post.

### D2.2. Начальные данные Public Post

**Статус:** IMPLEMENTED. Серверный loader живёт в `entities/post/api` (`getPostQueryData`) и
`views/post-details-page/api/loadInitialPost`. Страница подключает его в D2.3.

**Цель:** загружать полный Post на сервере без запроса из браузера.

**Объём:** `loadInitialPost(postId)`, прямой GraphQL `fetch` с `cache: 'no-store'`,
`InitialPostData`, `baselineKey` и строгая проверка ответа.

**Оценка:** 1–2 дня.
**Сложность:** Средняя.
**Зависит от backend:** Нет — PostEntity, автор, вложения и `null` для отсутствующего поста
подтверждены.

**Готово:** успешная загрузка возвращает полный Post; `null` отделён от технической ошибки;
неполный ответ или ошибка не попадают в Apollo Client; новая загрузка получает новый baseline.

**Основные проверки:** HTTP/transport, неверный JSON, GraphQL errors, `null`, необязательный файл
вложения, автор/ownerId и полный ответ.

### D2.3. Public Post SSR и metadata

**Статус:** IMPLEMENTED. `/posts/[postId]` загружает `getCachedInitialPost`, рендерит Post Details
в HTML страницы без Portal, вызывает `notFound()` для отсутствующего поста и локальный `error.tsx`
с `unstable_retry()`. Apollo seed реализован в D2.6. Перехваченный modal-вариант — D2.4.

**Цель:** отдать прямой маршрут Post как публичную SSR-страницу.

**Объём:** Server Component, `notFound()`, локальный `error.tsx`, `unstable_retry()`,
динамические `title/description` и общий `React.cache()` loader для page/metadata.

**Оценка:** 1–2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Нет; зависит от D2.1 и D2.2.

**Готово:** Post присутствует в начальном HTML без Portal; metadata не делает второй GraphQL-запрос;
Retry перезагружает Server Component; гость и авторизованный пользователь видят один публичный контент.

**Основные проверки:** SSR, 404, техническая ошибка, Retry, один запрос для страницы и metadata,
следующий HTTP request и отсутствие запроса при hydration.

### D2.4. Перехваченное модальное окно Post

**Статус:** IMPLEMENTED. Soft navigation на `/posts/[postId]` открывает
`@modal/(.)posts/[postId]` → `PostDetailsModal` поверх текущей App Shell страницы. Тот же
`getCachedInitialPost` и Post Details, что у canonical page; Close — `router.back()`, очищенный
`returnTo` только как запасной путь. Нет поста → локальное «Post is unavailable»; техошибка →
локальный `error.tsx` с Retry. Без `generateMetadata` и без `ProtectedRouteBoundary`.

**Цель:** открывать canonical Post поверх исходной страницы через существующий `@modal`.

**Объём:** `@modal/(.)posts/[postId]`, локальные состояния недоступности и ошибки,
`router.back()` для Close и очищенный `returnTo` только как запасной путь.

**Оценка:** 1–2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Нет; зависит от D2.2.

**Готово:** переход внутри приложения сохраняет исходную страницу и прокрутку; Close возвращает
назад; перезагрузка URL показывает canonical page; перехваченный маршрут не загружает metadata.

**Основные проверки:** Main/Profile/Public Home → модальное окно, Close, Back/Forward,
перезагрузка, недоступность, техническая ошибка/Retry; `returnTo` остаётся только запасным путём.

### D2.5. Ссылки в публичных карточках Post

**Статус:** IMPLEMENTED. `PostCard` линкует media на `/posts/[postId]` (опциональный `returnTo` для
Profile Close fallback). `PublicPostCard` / `PublicPostsGrid` линкуют media, `createdAt` и
description на `/posts/[postId]`, автора (аватар + имя) на `/profile/[authorId]`; carousel controls
и Show more / Hide остаются кнопками вне Link. Soft navigation из Main/Profile попадает в
intercepted modal (D2.4); direct/reload `/posts/[postId]` — canonical SSR.

**Цель:** сделать публичные посты и их авторов доступными из всех текущих лент и сеток.

**Объём:** общее Link-поведение `PostCard`, `PublicPostCard` и `PublicPostsGrid`.
Область медиа или деталей ведёт на `/posts/[postId]`, имя и аватар автора — на
`/profile/[authorId]`.

**Оценка:** 1–2 дня.
**Сложность:** Средняя.
**Зависит от backend:** Нет; зависит от D2.1 для полной route-проверки.

**Готово:** Public Home, Main, Profile и другие текущие места с полноценным Post используют
canonical Link; весь `article` не обёрнут в Link; карусель и другие кнопки работают отдельно.

**Основные проверки:** href и обычное поведение Link во всех трёх основных местах, ссылки автора,
previous/next без перехода, клавиатура/focus и единый Link-контракт для Public Home и Main.

### D2.6. Apollo seed и синхронизация Post mutations

**Статус:** IMPLEMENTED. Route-local `useSeedPostDetailsCache` пишет полный `postQuery` через
`writeQuery` в `useEffect` (повтор при смене `baselineKey`). UI остаётся на `initialPost`/`displayPost`
без клиентского `useQuery(postQuery)`. Edit обновляет локальный state и normalized cache ответом
мутации; Delete вычищает Post из cache (`synchronizeDeletedPost`) и закрывает view через
`closePage` (modal → `router.back()` / page → безопасный `returnTo`, иначе `/profile/[ownerId]`).

**Цель:** связать Post из SSR с существующим Apollo cache и mutations владельца.

**Объём:** route-local seed boundary через `postQuery`; отображение из
`initialPost/displayPost`; редактирование обновляет локальное состояние и normalized cache,
удаление очищает Post из cache и закрывает текущее представление.

**Оценка:** 2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Нет — текущие update/delete operations подтверждены.

**Готово:** hydration не вызывает `postQuery`; редактирование не делает refetch; удаление
синхронизирует cache и навигацию; действия владельца появляются только после точного клиентского
сопоставления owner ID.

**Основные проверки:** заполнение cache, отсутствие запроса из браузера, mutation payload после
редактирования, удаление из cache, новый baseline, гость/не-владелец/владелец и обновление cache
из другого компонента.

---

## Dev 3 — Edit Profile и Avatar

### D3.1. Edit Profile UI и отправка формы

**Статус:** реализована изолированная RHF-форма с начальными значениями и асинхронным
`onSubmitAction` через props. Успешная отправка вызывает `reset(savedValues)`, ошибка не теряет
изменения и допускает повторную попытку. Settings navigation вынесена в `settings/layout.tsx` и
использует ссылки существующих routes. Privacy Policy trigger использует `DocModal` и не сбрасывает
форму. Подключение маршрута и backend реализовано в D3.7.

**Цель:** собрать изолированную форму на RHF по Figma-композиции.

**Объём:** Username, First/Last Name, DOB, Country/City, About Me, полный
`EditProfileFormValues`, состояния Save и Privacy Policy через существующий `DocModal`.
Avatar в RHF не входит.

**Оценка:** 2 дня.
**Сложность:** Средняя.
**Зависит от backend:** Нет — форма получает значения и асинхронный обработчик через props.

**Готово:** Save выключена для pristine/invalid/`isSubmitting`; успех вызывает
`reset(savedValues)`; ошибка сохраняет values/dirty/touched; уход со страницы не блокируется.

**Основные проверки:** начальные значения, одна отправка, нормализация успешного ответа, повтор
после ошибки, сохранение формы при открытии Privacy Policy и независимость Avatar.

### D3.2. Edit Profile validation и DOB

**Статус:** реализованы локальные правила Username, First/Last Name, About Me и Date of Birth;
возраст сверяется с UTC-днём backend. Username допускает `!`, имена — пробелы, дефис и апостроф.
DatePicker открывается на выбранном или текущем месяце.

**Цель:** реализовать подтверждённые правила полей и возраста.

**Объём:** Username 6–30; First/Last Name 1–50; About Me до 200; необязательная DOB; будущая дата
и минимальный возраст 13 лет. Переиспользовать управляемый `DatePicker`.

**Оценка:** 1–2 дня.
**Сложность:** Средняя.
**Зависит от backend:** Нет; правила backend позже сверяются при интеграции.

**Готово:** обязательные поля учитывают пробелы, значения не нормализуются при потере focus,
возраст считается по календарной дате, DatePicker открывается на выбранном или текущем месяце.

**Основные проверки:** границы длины и допустимых символов, пробелы, пустая/будущая DOB, ровно
13 лет, 13-летие завтра, високосный год и видимый месяц.

### D3.3. Country → City

**Статус:** реализована зависимость через `countryOptions` и `cityOptionsByCountryValue` props:
смена Country очищает City, список берётся для текущей Country, а City выключен без доступных
вариантов. Production lookup не подключён на frontend; backend dev реализован (#28).

**Цель:** реализовать зависимые Select без временного набора production-данных.

**Объём:** `countryOptions` и `cityOptionsByCountryValue` через props; смена или очистка Country
сбрасывает City; City выключен без доступных вариантов.

**Оценка:** 1 день.
**Сложность:** Простая.
**Зависит от backend:** Контракт lookup реализован в dev (#28); для live-приёмки нужны deploy/seed и сохранение через #31.

**Готово:** значения вариантов остаются непрозрачными ключами UI; фикстуры живут только в тестах и
Storybook; рабочий маршрут не получает временный список стран.

**Основные проверки:** пустое состояние, фильтрация, смена Country, страна без городов, сброс и
выключенное состояние.

### D3.4. Выбор, проверка и предпросмотр Avatar

**Статус:** реализован локальный Avatar draft: JPEG/PNG, лимит 10 MiB, preview через object URL,
безопасная замена, Cancel и cleanup URL. Decode и crop реализованы в D3.5.

**Цель:** управлять локальным черновиком Avatar и его ресурсами.

**Объём:** file input, точный MIME `image/jpeg | image/png`, максимум 10 MiB, object URL,
предпросмотр, замена, Cancel и очистка ресурсов.

**Оценка:** 1–2 дня.
**Сложность:** Средняя.
**Зависит от backend:** Нет.

**Готово:** сначала проверяется MIME, затем размер; ровно 10 MiB допустимо; недопустимая замена
сохраняет предыдущий черновик; новый допустимый файл и очистка освобождают старый URL.

**Основные проверки:** границы MIME/размера, первый недопустимый файл, недопустимая/допустимая
замена, Cancel, unmount и отсутствие object URL для недопустимого кандидата.

### D3.5. Обрезка Avatar и обработка decode

**Статус:** IMPLEMENTED. Валидный файл остаётся кандидатом до `onReady` существующего cropper;
подтверждённый `AvatarCropSelection` хранит исходный `File` и квадратные неокруглённые координаты.
Ошибочный или отменённый candidate освобождает только свой object URL, без canvas, Blob или upload.

**Цель:** вернуть подтверждённую квадратную область декодированного изображения без
upload/export.

**Объём:** фиксированная обрезка `1:1`, круглая маска предпросмотра, кандидат в ожидании до
cropper `onReady`,
`AvatarCropSelection` с source `File` и `left/top/width/height` для orientation-normalized
bitmap.

**Оценка:** 2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Нет; использовать существующий cropper без импорта Create Post pipeline.

**Готово:** Save выключена до decode; `width === height`; значения не округляются; `onError`
освобождает URL кандидата и сохраняет предыдущий допустимый черновик либо пустое состояние;
устаревшие callbacks игнорируются.

**Основные проверки:** успех/ошибка decode, ошибка при замене, очистка URL, устаревшие callbacks,
координаты с учётом orientation, квадратная геометрия и отсутствие Blob/canvas/upload.

### D3.6. Подтверждение удаления Avatar

**Статус:** IMPLEMENTED. Локальный Modal удаляет только переданный сохранённый Avatar через
`OnDeleteAvatar`; draft и crop candidate независимы. Операция не оптимистическая: pending блокирует
закрытие и действия Avatar, успех очищает сохранённый Avatar, ошибка сохраняет его и разрешает retry.

**Цель:** подготовить отдельный UI удаления сохранённого Avatar.

**Объём:** локальный `Modal` подтверждения, удаление только сохранённого Avatar и
`OnDeleteAvatar = () => Promise<void>`. Черновик не считается сохранённым Avatar.

**Оценка:** 1 день.
**Сложность:** Средняя.
**Зависит от backend:** Нет для UI; production-обработчик ожидает mutation удаления.

**Готово:** операция не оптимистическая; состояние ожидания блокирует закрытие и другие действия
с Avatar; успех очищает сохранённый Avatar; ошибка сохраняет его и разрешает повтор.

**Основные проверки:** видимость, Yes/No/закрытие, один активный вызов, успех, ошибка/повтор и
отсутствие изменений RHF.

### D3.7. Интеграция Edit Profile с backend

**Статус:** PARTIAL целиком; чтение/сохранение подключено на frontend (#197), async lookup отсутствует, live-приёмка ждёт backend #31.

`/settings/profile` → `views/settings-page` собирает session и EditProfileForm без feature-to-feature imports.
CurrentUser даёт prefill без нового Me. Callback D1.8 захватывается **до** updateProfile;
только принятый ответ синхронизирует cache/session и вызывает RHF reset. Ошибки сохраняют draft.
Submit сериализован; editable поля выключены до завершения запроса. Смена owner ID перемонтирует форму.
Optional поля опускаются по dirtyFields, очистка передаёт null; DOB — календарная YYYY-MM-DD,
возраст сверяется с UTC-днём. GraphQL codes/field details попадают в RHF; USER_UNDER_13 даёт Privacy Policy.

Frontend lookup API отсутствует (backend #28 уже merged): saved Country/City показаны read-only и не отправляются без изменений.
Отдельно нужны countries(search), cities(countryId, search, limit), debounce и loading/error/clearing UX
по [контракту](./07-backend-contract.md#7-prefill-формы-me). Production mocks и Avatar mutations не добавлены.

Проверки: mocked API/browser auth/cache/routes — 43 файла, 246 тестов; TypeScript, ESLint,
Prettier и git diff --check. Select/Radix warning про style на Fragment воспроизведён на неизменённом dev:
это существующий дефект placeholder/asChild, не регрессия D3.7. Backend-dependent build не запускался.

**Цель:** подключить форму к реальным данным и сохранению.

**Объём:** подтверждённые GraphQL operations чтения/обновления, преобразование данных между
сервером и формой, ошибки backend и замена заглушки `/settings/profile`. Avatar operations
остаются отдельно.

**Оценка:** 2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Да — Edit Profile contract и Country/City source.

**Готово:** маршрут использует реальные начальные значения; mutation возвращает сохранённые
значения для `reset`; ошибки поля/формы отображаются без потери состояния; фиктивного успеха нет.

**Основные проверки:** преобразование null/пустых значений, DOB/timezone, представление
Country/City, нормализованный успешный ответ, ошибки проверки, повтор и отсутствие Avatar-вызова
при отправке Profile.

### D3.8. Интеграция Avatar с backend

**Цель:** подключить Avatar UI к подтверждённым upload и profile mutations.

**Объём:** export по требованиям backend, Avatar purpose, initiate/PUT/complete,
attach/replace/delete и URL для отображения. Обновлять Session/Profile/Apollo только
подтверждённым mutation payload.

**Оценка:** 2 дня.
**Сложность:** Сложная.
**Зависит от backend:** Да — Avatar upload/attach/replace/delete contract.

**Готово:** attach использует только готовый файл; `profilePictureFileId` не используется как URL;
replace/delete не оптимистические; правила жизни signed/public URL соблюдены; RHF не меняется.

**Основные проверки:** ограничения export, upload/complete, attach, replace, delete/retry, URL для
отображения, синхронизация cache/session и очистка object URL.

## Текущий порядок завершения

Следовать таблице аудита выше. D1.1–D1.2, D2.1–D2.6 и D3.1–D3.6 повторно не реализовывать.
Country/City не считать отсутствующим backend; Avatar upload не путать с сохранением фото.
