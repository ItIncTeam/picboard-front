# Sprint 05 Frontend Task Breakdown

Status: **ARCHITECTURE AUDIT PAUSED / IN PROGRESS**.

Этот документ перечисляет только подтвержденные work streams. Это не финальный implementation plan:
точные file changes, PR sequence и команды проверки определяются после завершения architecture
audit и отдельного backend-contract audit.

## Общие ограничения

- Не создавать временные GraphQL contracts, User fields, mutations или fake counters.
- Не показывать fake-success persistence на production routes.
- Не добавлять dependencies без отдельного подтверждения.
- Не создавать generic abstractions без доказанного повторения.
- Сохранять существующие App Router, FSD, Apollo singleton и local pagination boundaries.
- При изменении routing/behavior синхронизировать relevant docs.

## Contract-independent work

Эти streams могут выполняться параллельно с backend work после завершения общего architecture audit.

### Stream A: Edit Profile form UI and state

- Собрать `EditProfileForm` как feature через explicit typed props.
- Использовать полный `EditProfileFormValues`: string для всех text/select fields, `Date | null`
  только для DOB; optional string fields представлять как `''`.
- Всегда передавать полный `defaultValues` shape; не включать Avatar и не вводить backend DTO.
- Получать `countryOptions` и `cityOptionsByCountryValue` через props на базе существующего
  `SelectOption`; считать option values opaque UI keys.
- При пустом Country держать City empty/disabled; при смене Country всегда reset-ить City, а при
  отсутствии options также оставлять его empty/disabled.
- Не добавлять production geography source/API/dependency или async options infrastructure.
- Настроить RHF fields/state без backend field mapping.
- Реализовать Sprint 05 client validation feature-local rules:
  - Username: required/trim-aware, `6–30`, Latin letters/digits/`_`/`-`;
  - First/Last Name: required/trim-aware, `1–50`, Latin/Cyrillic letters;
  - Country/City: optional без дополнительных length/regex rules;
  - About Me: optional, maximum `200`, без дополнительного character allowlist.
- Не переносить signup schema автоматически, не менять case и не мутировать values on blur.
- Хранить optional DOB как `Date | null`; валидировать future date и age `< 13` по calendar
  year/month/day.
- Переиспользовать controlled shared `DatePicker`: selected DOB задает initial visible month, null
  использует current month из testable `today`.
- При необходимости минимально исправить shared primitive, чтобы hardcoded November 2023 не влиял
  на Edit Profile; не создавать DOB-specific picker/workaround.
- Сохранить Figma month-only navigation и отметить неудобство выбора старого DOB как design
  usability limitation; year navigation оставить product/design-gated.
- Передавать current date в age helper явно и покрыть null/future/exactly-13/13-tomorrow/older и
  естественно затронутые leap-year boundaries.
- Сохранить RHF `mode: 'onTouched'`; не добавлять custom date-validation lifecycle или API
  serialization до backend contract.
- Открывать Privacy Policy через существующий `DocModal`, не размонтируя форму.
- Проверить сохранение values/errors/touched/dirty/date после открытия и закрытия документа.
- Не добавлять navigation guard; navigation away разрешена.
- Держать `isDirty`, submit и `reset(savedValues)` только в Profile form boundary.
- Отключать Save при pristine, invalid или pending state; выполнять submit только через RHF
  `handleSubmit` и не блокировать всю форму во время pending.
- При success делать returned saved values новым baseline через `reset(savedValues)`; при failure
  сохранять values/dirty/touched/baseline и показывать local form-level error.
- Проверить single-submit pending guard, backend-normalized reset и повторный submit после failure.
- Не включать Avatar draft или operations в RHF state и Save lifecycle.
- Подготовить focused unit/component tests и isolated Storybook preview, используя текущий project
  setup.
- Покрыть empty/whitespace и length/character boundaries `5/6/30/31`, `1/50/51`, а также About Me
  `200/201` и special characters.
- Проверить empty-string/null defaults, сохранение raw whitespace и полный saved callback/reset
  shape.
- Проверить Country → City filtering/reset/disabled states и отсутствие fixture imports в
  production route.
- Не подключать форму к `/settings/profile` до backend integration stream.

### Stream B: Avatar contract-independent UI

- Подготовить select/preview/fixed `1:1` crop/cancel UI через explicit props/callbacks.
- Использовать circular presentation mask, не создавая физически круглый output или transparent
  corners.
- Ограничить crop interaction подтвержденным позиционированием/центрированием; не добавлять
  неподтвержденные zoom/scale controls.
- Использовать file-picker hint `accept="image/jpeg,image/png"`, но валидировать exact MIME
  allowlist и maximum size `10 * 1024 * 1024` bytes до создания preview/draft.
- Проверять format раньше size и показывать одну deterministic validation error; ровно `10 MiB`
  принимать.
- Подготовить delete-avatar confirmation UI.
- Показывать delete control только для saved avatar; draft не считать сохраненным avatar.
- Реализовать non-optimistic local confirmation через `OnDeleteAvatar = () => Promise<void>`:
  pending блокирует actions/dismiss/concurrent Avatar operation, success очищает avatar, failure
  сохраняет его и допускает retry.
- Проверить object URL cleanup для local preview, если он потребуется выбранному UI flow.
- Не выбирать upload purpose и не моделировать attach/replace/delete persistence.
- Не использовать `profilePictureFileId` как display URL.
- Возвращать из isolated UI typed crop selection/positioning result, а не backend file contract.
- Описать `AvatarCropSelection` только через source `File` и square `left/top/width/height` в pixels
  исходного изображения.
- Не выводить object URL, canvas, cropper refs/transforms или upload metadata через feature contract.
- Оставить dimensions/compression/conversion/encoding backend-gated.
- Создавать/revoke-ить preview object URL внутри Avatar feature; Cancel и новый valid file должны
  очищать предыдущий draft resource.
- Invalid first selection не должен создавать object URL/draft; invalid replacement должен
  сохранять текущие valid preview, crop и object URL.
- Новый valid replacement должен очистить error, revoke-нуть старый URL и полностью reset-нуть
  crop draft.
- Не добавлять content sniffing/dependency и не менять Create Post validation с другим limit.
- Держать Avatar state/error lifecycle независимо от Profile form.
- Проверить, что Avatar cancel/success/delete не меняют RHF state и Profile Save не запускает
  Avatar operations.
- Проверить delete visibility, dismiss, single pending call, success/failure/retry и отсутствие
  feature-level Delete Post imports.
- Не создавать combined form/avatar transaction или orchestration state в Settings view.

### Stream C: Public Profile/Post presentation and route contracts

- Подготовить typed serializable `InitialProfileData` и `InitialPostData` boundaries согласно
  Decision Log.
- После подтверждения counters contract собрать одну `initialProfileQuery` с user/counters/first
  page и выполнить один raw POST; не создавать multi-request orchestration.
- Использовать общий first-page variables factory без `after`; явно включить server-printed
  `__typename` и обеспечить field/selection compatibility с `profilePostsQuery`.
- Seed-ить complete combined result одним `writeQuery`; incomplete/partial result считать technical
  failure и не seed-ить.
- Реализовать локальные Profile/Post seed boundaries через existing `useApolloClient()`,
  `useEffect` и `seededBaselineKey`; до matching key держать Profile query на `skipToken`.
- Не выполнять render-time/layout-effect writes; StrictMode repeated seed должен оставаться
  idempotent и не создавать network request.
- При новом server baseline снова включать `skipToken`, seed-ить complete payload и только затем
  активировать Profile query. Post при этом остается на props/local display ownership.
- Сохранить Profile pagination/reconciliation ownership локальным.
- Сохранить Post `initialPost`/`displayPost` ownership отдельно от Apollo cache.
- Подготовить direct/intercepted presentation adapters и close strategies без дублирования Post
  Details.
- Добавить route-local canonical/intercepted Post error boundaries: technical failures используют
  generic UI и Next 16.2.4 `unstable_retry()`, а confirmed null остается 404/unavailable semantics.
- Не seed-ить cache для null/error; successful Retry должен создавать новый complete baseline.
- Перенести canonical `/posts/[postId]` непосредственно под public app shell и добавить
  `@modal/(.)posts/[postId]`; оставить canonical `/posts/create` и intercepted Create flow
  protected.
- Добавить Profile/Main soft Post entry points, не меняя Public Home navigation и не вводя
  query-param routing.
- После route implementation точечно синхронизировать stale Post placement в
  `docs/app-router-roadmap.md`.
- Подготовить focused tests с deterministic `baselineKey` fixtures.
- Не подключать backend-blocked Profile counters или временные fallbacks.
- Сохранить public SSR обязательным anonymous baseline и показывать owner controls только после
  client `SessionProvider` bootstrap/exact owner ID match.
- Не оборачивать public routes в `ProtectedRouteBoundary`; session failure не должен заменять
  public content или route error state.
- Проверить, что session transition не refetch-ит public data, не меняет baseline и не remount-ит
  global providers.

### Stream D: Figma requirements audit

- Получать metadata/tree из root `1:12` и design context/screenshots только конкретных frames.
- Сравнивать Edit Profile, Avatar, Profile и Post frames с существующими project primitives.
- Фиксировать MCP limitation: root canvas design context может требовать concrete frame.
- Отмечать unsupported Post engagement UI как `design-visible / contract-unavailable`.
- Не копировать Figma-generated Tailwind code и не придумывать размеры отсутствующих frames.

## Backend-gated work

### Stream E: Live contract audit and backend work package

- Повторить live introspection перед integration.
- Подтвердить Profile read/update fields, types и nullability.
- Подтвердить backend validation/error shape.
- Сверить backend constraints с frontend-known Sprint 05 rules; конфликт фиксировать как
  `CONTRACT CONFLICT`, не менять frontend validation молча.
- Подтвердить public counters и источник `publicationsCount`.
- Подтвердить Avatar upload purpose, mutations и display URL.
- Подтвердить missing user/post semantics: nullable result или typed GraphQL error.
- Подтвердить nested Post author shape и при необходимости зафиксировать SSR waterfall.
- Подтвердить `updatedAt` semantics отдельно; opaque baseline от него не зависит.
- Сформировать один конкретный backend work package вместо временных frontend contracts.

### Stream F: Edit Profile production integration

Запускается только после Stream E.

- Добавить подтвержденные read/update GraphQL documents и typed mappings.
- Передать реальные initial values в `EditProfileForm`.
- Подключить mutation и backend error mapping.
- На success использовать сохраненный backend payload и вызвать `reset(savedValues)`.
- Заменить `/settings/profile` placeholder только после полной read/save integration.

### Stream G: Avatar production integration

Запускается только после Stream E.

- Подключить подтвержденный upload purpose и upload lifecycle.
- Подключить attach/replace/delete mutations.
- Использовать подтвержденный display avatar URL contract.
- Синхронизировать Profile, session и normalized cache только в границах live contract.

### Stream H: Atomic Public Profile SSR integration

Запускается после подтверждения обязательных counters и query shapes.

- Выполнить atomic raw server load с `cache: 'no-store'`.
- Обработать `user === null` через `notFound()` и technical failure через route error UI.
- Создать один server `baselineKey` на successful payload.
- Seed-ить цельный user/counters/first-page payload до activation Profile query.
- Сохранить `cache-first`, declarative polling и local pagination model.

### Stream I: Public Post SSR integration

Запускается после live verification текущего Post contract и missing-resource signal.

- Вынести canonical route из protected group без изменения URL.
- Добавить intercepted Post adapter в существующий `@modal` slot.
- Выполнить raw server load и создать один `baselineKey`.
- Seed-ить `postQuery`, но рендерить UI из `initialPost`/local `displayPost`.
- Реализовать canonical 404 и modal-scoped unavailable/error states.
- Сохранить edit/delete cache synchronization и presentation-specific navigation.

## Product-decision-gated work

Не включать без отдельного product confirmation и live backend contract:

- Followers list/modal.
- Following list/modal.
- Follow.
- Unfollow.

## Follow-up work

- Delete follower.
- Send Message, если отдельно не подтвержден.
- Public Post comments, replies, likes, counters и engagement actions.

## Confirmed verification groups

Final implementation plan должен разложить проверки минимум на следующие группы:

- SSR request count, initial HTML и отсутствие hydration duplicates.
- Atomic Profile failure/null/partial-result behavior.
- Apollo seed compatibility, normalization и mutation synchronization.
- Profile fetchMore/polling/reconciliation и baseline reset.
- Direct/intercepted Post navigation, errors, delete и Back/Forward.
- Post local display ownership, edit synchronization и baseline reset.
- Edit Profile RHF validation, Privacy modal lifecycle и разрешенный navigation away.
- Avatar file validation, preview/crop/cancel и local resource cleanup.
