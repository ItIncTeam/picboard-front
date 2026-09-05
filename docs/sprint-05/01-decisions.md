# Sprint 05 Decision Log

Здесь находятся только подтвержденные решения. Неподтвержденные рекомендации не являются частью
Sprint 05 architecture.

## 1. Canonical Post URL and interception

**Decision**

`/posts/[postId]` остается canonical public SSR route. Soft navigation из Main/Profile открывает
тот же Post через intercepted route в существующем `@modal`; direct URL и reload рендерят
standalone page. Требование `/profile/[userId]?postId=[postId]` не реализуется без отдельного
product decision.

**Reason**

Canonical URL уже соответствует текущей App Router architecture и поддерживает shareable direct
links без эмуляции modal routing через query parameters.

**Consequences / constraints**

- Canonical adapter должен быть вынесен из protected route group и оставаться под `(app-shell)`.
- Canonical и intercepted adapters используют один loader, initial-data contract и Post Details.
- Они отличаются presentation adapter и close strategy.

## 2. Public SSR freshness and transport

**Decision**

Public Profile и Post используют dynamic SSR per request без ISR. Server loaders выполняют raw
GraphQL `fetch` с явным `cache: 'no-store'`; browser Apollo Client на сервере не используется.

**Reason**

Public data должна находиться в initial HTML и быть свежей на каждый request. Raw server transport
избегает cross-request Apollo cache и продолжает существующий Public Home pattern.

**Consequences / constraints**

- Server использует `print(query)` общего operation document; client использует тот же document и
  variables для cache seed. Continuation query должна иметь cache-compatible field arguments и
  selection; Post переиспользует тот же `postQuery`, Profile продолжает отдельным совместимым
  `profilePostsQuery` после combined initial seed.
- Public SSR не передает access token, refresh cookie или viewer-specific headers.
- Server transport проверяет transport/HTTP, JSON, GraphQL errors и обязательный payload.
- Второй Apollo Client, server ApolloProvider и `@apollo/client-integration-nextjs` не добавляются.
- Маленький shared transport helper допустим только после появления фактической duplication.

## 3. Apollo SSR-to-client continuation

**Decision**

Приложение сохраняет один существующий global browser Apollo singleton. Цельный server payload
передается сериализуемыми props и seed-ится route-level client boundary через cache-compatible
`writeQuery`.

**Reason**

Это дает SSR HTML и продолжает существующие client queries/mutations без второго initial network
request и без нового data layer.

**Consequences / constraints**

- Server result и seed используют тот же operation document/variables; subsequent client queries
  должны иметь совместимые field arguments и selection sets.
- Server result содержит `id` и необходимые `__typename` для normalization.
- Profile query получает `skipToken` до завершения seed, затем `cache-first`.
- Post Details рендерится из `initialPost` и не запускает hydration-time `post(id)` query.
- Seed не выполняется для partial initial payload.
- `fetchMore`, polling, refetch и mutation synchronization должны продолжить работать.

## 4. Atomic initial Profile SSR

**Decision**

`InitialProfileData` состоит из `user`, public counters, first `profilePosts` page и server-generated
`baselineKey`. Initial load атомарен.

**Reason**

Частичный Profile создает противоречивый HTML и неполный Apollo seed.

**Consequences / constraints**

- `user === null` приводит к `notFound()`.
- Technical failure любого обязательного initial request приводит к route-level error с Retry.
- Partial GraphQL result с errors является technical failure, если отсутствует обязательная часть.
- После успешного SSR ошибки `fetchMore`, polling и explicit refetch остаются локальными и не
  уничтожают текущий Profile.

## 5. Profile baseline and local pagination ownership

**Decision**

Profile server composition один раз создает `baselineKey` через встроенный `crypto.randomUUID()`.
Profile client boundary привязан к `userId + baselineKey`. Существующая локальная pagination model
остается владельцем `fetchMore` history и cursor reconciliation; global Apollo `typePolicy` и
generic pagination abstraction не добавляются.

**Reason**

Backend cursors не гарантированы между разными SSR snapshots, а текущая локальная model уже решает
pagination и first-page reconciliation.

**Consequences / constraints**

- Profile A → B полностью сбрасывает local history/revision/status.
- `router.refresh()` того же Profile намеренно удаляет загруженные pages и начинает с новой seeded
  first page.
- Polling и `fetchMore` baseline не меняют.
- Polling обновляет first page; displaced posts переносятся в local history.
- Изменение cursor chain сбрасывает pagination revision.
- Global Apollo cache, SessionProvider и app-shell state не remount-ятся.

## 6. Profile polling lifecycle

**Decision**

После seed Profile query использует `fetchPolicy: 'cache-first'` и `pollInterval: 60_000`.

**Reason**

Apollo Client поддерживает требуемый lifecycle декларативно; дополнительный controller не нужен.

**Consequences / constraints**

- До seed используется `skipToken`.
- Initial data читается из cache; первый poll выполняется примерно через 60 секунд.
- Ручные `startPolling()`/`stopPolling()`, visibility/offline managers, backoff и polling hooks не
  добавляются.
- Poll failure сохраняет Profile и history, показывает local non-blocking error/retry.
- Retry использует explicit `refetch()`; successful poll очищает transient error.

## 7. Public Profile and social data boundary

**Decision**

Public SSR data включает `publicationsCount`, `followersCount`, `followingCount`. Viewer-specific
`isFollowing`, capabilities и relationship actions остаются client data. Social lists/actions
следуют scope из Overview.

**Reason**

Public counters нужны в initial HTML, а viewer relationship зависит от client-only session.

**Consequences / constraints**

- `publicationsCount` нельзя вычислять по первой cursor-page: текущий `profilePosts` не имеет
  `totalCount`.
- Anonymous SSR не зависит от `/me`.
- Backend-blocked Follow/Unfollow/Send Message controls не заменяются fake или disabled actions.

## 8. Public Post payload scope

**Decision**

Sprint 05 SSR Post ограничен доступными author, attachments/media, description и `createdAt`.
Comments, replies, likes, engagement counters и actions являются follow-up/backend-blocked.

**Reason**

Figma показывает больше элементов, чем предоставляет текущий GraphQL contract.

**Consequences / constraints**

- Figma review отмечает такие элементы как `design-visible / contract-unavailable`.
- Mock contracts, temporary fields и fake counters не создаются.
- Если `post(id)` не содержит nested author, допустим дополнительный `user(ownerId)` SSR request,
  но он фиксируется как backend inefficiency/potential waterfall.
- Текущий local schema snapshot содержит nested author; live shape проверяется backend audit.

## 9. Post null and technical error semantics

**Decision**

Canonical `post === null` вызывает `notFound()`. Intercepted `post === null` показывает local
`Post is unavailable` modal и сохраняет underlying route. Technical errors не маскируются под 404.

**Reason**

Canonical route требует корректной resource semantics, а modal должен сохранить navigation context.

**Consequences / constraints**

- Close unavailable modal вызывает `router.back()`.
- Canonical technical error использует route error UI; intercepted error остается modal-scoped.
- Retry не создает hydration-time `useEffect` request.
- Backend audit подтверждает, возвращает ли missing post `null` или typed GraphQL error.
- Повторное открытие удаленного Post следует тем же null/unavailable semantics.

## 10. Post close and delete navigation

**Decision**

Intercepted Post закрывается через `router.back()`. Direct/reloaded canonical Post закрывается в
`/profile/[ownerId]`. Sanitized `returnTo` остается только fallback для delete и нестандартной
history, а не заменой intercepted routing.

**Reason**

Browser history должна сохранять исходный Main/Profile и scroll при soft navigation, а direct URL
не имеет надежного underlying entry.

**Consequences / constraints**

- Reload modal URL становится standalone page.
- Direct close использует `ownerId` из server-loaded Post.
- Delete следует presentation-specific close destination.
- Back/Forward не должны оставлять stale modal slot.

## 11. Post Apollo seed and display ownership

**Decision**

Цельный `initialPost` seed-ится в Apollo через тот же `postQuery` и `{ id: postId }`, но открытый
Post UI рендерится из server props/local `displayPost`, а не из Apollo subscription.

**Reason**

Apollo seed нужен для normalization и cross-feature mutation synchronization; local display state
нужен для мгновенного edit UX без refetch.

**Consequences / constraints**

- `useQuery(postQuery)` в Post Details не добавляется.
- Edit mutation одним payload обновляет normalized entity и local `displayPost`.
- Дополнительный post refetch после edit не выполняется.
- Delete evicts `PostEntity` по `__typename + id` и сразу закрывает current presentation.
- Apollo cache update из другого consumer сам по себе не меняет открытый Post UI.
- Третьего конкурирующего state source не создается.

## 12. Post baseline identity

**Decision**

Общий server Post composition один раз создает сериализуемый `baselineKey` через встроенный
`crypto.randomUUID()`. Client Post boundary keyed этим значением.

**Reason**

Нужен надежный reset при navigation/refresh без deep comparison и без неподтвержденной revision
semantics `updatedAt`.

**Consequences / constraints**

- `baselineKey` не является GraphQL field, Apollo key или cache data.
- Новый successful server load полностью сбрасывает Post route-local state.
- Local edit baseline не меняет; `router.refresh()` создает новый baseline.
- Если backend подтвердит надежное version field, его можно рассмотреть как замену opaque key без
  изменения ownership architecture.

## 13. Edit Profile and Avatar integration boundary

**Decision**

Contract-independent UI/state/tests разрешены до backend contract, но `/settings/profile` остается
placeholder до подтвержденных read/update operations и mappings.

**Reason**

Backend-blocked feature не должна блокировать frontend development, но production route не должен
имитировать работающую persistence.

**Consequences / constraints**

- UI получает explicit props и проверяется isolated.
- Fake submit, mock mutation, temporary GraphQL documents/User fields и fake production initial
  data запрещены.
- После live introspection подключаются реальные initial values, mutation и error mapping.
- После mutation success RHF вызывает `reset(savedValues)` с фактическим backend payload.

## 14. Privacy Policy and form lifecycle

**Decision**

Age-validation link открывает существующий local `DocModal`; отдельный Privacy route не создается.
Edit Profile остается mounted.

**Reason**

Local modal естественно сохраняет RHF values/errors/touched/dirty/date без дополнительного storage.

**Consequences / constraints**

- Global store, URL serialization и Web Storage не используются.
- Открытие/закрытие modal не является navigation.
- Текст/label существующего auth-specific `DocModal` может потребовать минимальной адаптации для
  повторного использования, но новый modal manager не создается.

## 15. No Edit Profile navigation guard

**Decision**

Sprint 05 не блокирует уход с dirty Edit Profile.

**Reason**

Product requirement явно разрешает navigation away без сохранения.

**Consequences / constraints**

- Не добавляются custom confirm, `beforeunload`, `popstate`, Link/router interception или global
  guard infrastructure.
- RHF `isDirty` остается локальным form state для реальной UI/Save logic.
- Несохраненные изменения теряются при уходе со страницы.
- Факт отсутствия простого полного App Router blocking API в Next.js 16.2.4 не является Sprint 05
  проблемой.

## 16. Anti-overengineering rule

**Decision**

Использовать самое простое решение на существующих Next.js, Apollo, React и project primitives.

**Reason**

Sprint 05 имеет конкретный scope и не должен создавать инфраструктуру для гипотетического reuse.

**Consequences / constraints**

- Перед новым hook/provider/manager/service/wrapper/helper проверяется существующий API.
- Generic abstraction не создается для одного use case.
- Не выполняются unrelated refactors.
- Новый слой допустим только при доказанной duplication или отдельном state ownership.

## 17. Edit Profile and Avatar ownership

**Decision**

`EditProfileForm` и Avatar являются независимыми feature boundaries. Их backend operations, local
state и success/error lifecycle не объединяются в одну форму или transaction.

**Reason**

Они визуально находятся на одном Settings screen, но имеют независимые UX lifecycle и разные
backend contracts.

**Consequences / constraints**

- `EditProfileForm` владеет только text/date/location fields, RHF state и profile Save.
- RHF `isDirty` не включает avatar draft; successful profile Save вызывает только
  `reset(savedValues)`.
- Avatar feature отдельно владеет select, preview, crop/centering, cancel, upload, replace, delete и
  собственными success/error states.
- Profile Save не запускает Avatar operation; Avatar success/cancel не сбрасывает Profile form.
- Settings/Profile view только компонует feature boundaries и не создает combined coordinator.
- Ошибка одной feature не должна ломать вторую.
- Generic crop/upload manager, shared form/upload state machine и новый global state не добавляются.

## 18. Avatar crop shape

**Decision**

Avatar использует fixed `1:1` square crop. Круг является только presentation mask/preview и не
меняет физическую форму результата.

**Reason**

Круглый avatar в UI не требует необратимо вырезать круг из файла; JPEG также не поддерживает
transparent corners.

**Consequences / constraints**

- Пользователь позиционирует/центрирует изображение внутри square crop.
- Physical circular image и transparent corners не генерируются.
- Zoom/scale controls не добавляются без подтвержденного Figma frame или product requirement.
- Modal Save подтверждает только Avatar crop result и не связан с Profile Save/RHF state.
- До backend contract isolated UI возвращает typed selection/positioning result, а не имитирует
  production upload.
- Final dimensions, compression, MIME conversion, encoding, upload payload, purpose,
  attach/replace lifecycle и display URL остаются backend-gated.
- Новый выбранный файл полностью сбрасывает предыдущий crop draft.
- Generic crop pipeline заранее не создается; existing primitives переиспользуются только без
  feature coupling и лишней сложности.

## 19. Avatar crop selection contract

**Decision**

Contract-independent Avatar crop возвращает только исходный `File` и квадратную область в системе
координат исходного изображения:

```ts
type AvatarCropSelection = {
  sourceFile: File
  crop: {
    left: number
    top: number
    width: number
    height: number
  }
}
```

**Reason**

До backend contract frontend должен описывать пользовательский выбор, не фиксируя будущий file
encoding/upload contract и не заимствуя более сложную Create Post semantics.

**Consequences / constraints**

- Координаты измеряются в pixels исходного изображения; `width === height`.
- Result не содержит `Blob`, exported `File`, object URL, canvas, `CropperRef`, transforms,
  `visibleArea`, backend или upload metadata.
- Preview object URL остается внутренним resource Avatar feature; feature создает и revoke-ит его.
- File selection создает draft; Cancel его отбрасывает; Save подтверждает selection без
  encoding/upload.
- Новый valid file полностью сбрасывает предыдущую crop selection.
- После backend audit отдельный integration step выполняет encoding и upload по подтвержденным
  dimensions, MIME, quality, size, purpose и attach/replace contract.
- Avatar не импортирует `CreatePostCropGeometry`, create-post export pipeline или feature-level код
  из `features/create-post`.
- Rotation, zoom и transforms не проектируются без отдельного UX requirement.

## 20. Avatar file validation

**Decision**

Avatar выполняет локальную UX validation до создания preview/crop draft: принимает только exact
`File.type` `image/jpeg` или `image/png` и размер не более `10 * 1024 * 1024` bytes. Атрибут
`accept="image/jpeg,image/png"` остается только hint для file picker.

**Reason**

`File.type` и client size check дают требуемую раннюю обратную связь, но не являются security
boundary. Avatar и Create Post имеют разные limits и lifecycle, поэтому общий feature-level
validator не нужен.

**Consequences / constraints**

- Validation order фиксирован: format, затем size; UI показывает одну deterministic error.
- Файл размером ровно `10 MiB` допустим; превышение дает size error.
- Первый invalid selection не создает draft или object URL.
- Invalid replacement сохраняет текущие valid draft, preview, object URL и crop state, одновременно
  показывая error нового выбора.
- Следующий valid selection очищает error, revoke-ит старый object URL, создает новый preview/draft
  и полностью сбрасывает crop selection.
- Старый object URL revoke-ится только при successful replacement или lifecycle cleanup.
- Magic-byte/content sniffing, MIME detection library и image parsing dependency не добавляются.
- Create Post validation с limit `20 MiB` не переиспользуется и не изменяется.
- Окончательная content/MIME/security/size validation и upload rejection mapping остаются
  backend-gated.

## 21. DOB and age validation

**Decision**

Contract-independent DOB value имеет тип `Date | null` и является optional. Если дата указана, она
не может быть в будущем, а возраст должен быть не меньше 13 лет.

**Reason**

Figma не помечает DOB обязательным, существующий `DatePicker` уже работает с `Date | null`, а
backend date scalar/serialization пока отсутствует. Calendar comparison избегает ошибок
timestamp-based расчета возраста.

**Consequences / constraints**

- `null` проходит validation; API serialization и timezone mapping пока не фиксируются.
- Возраст считается по calendar year/month/day, без milliseconds или деления на 365 days.
- Пользователь, которому исполнилось 13 лет сегодня, проходит; если 13-летие завтра, validation
  завершается ошибкой.
- Future date дает validation error на уровне Edit Profile schema; generic `DatePicker` API ради
  этого заранее не расширяется.
- Age `< 13` error содержит link на Privacy Policy через существующий `DocModal`; открытие modal не
  размонтирует форму и сохраняет DOB/error/touched/dirty.
- RHF сохраняет project pattern `mode: 'onTouched'`; отдельный validation lifecycle не создается.
- Age helper получает current date явно, чтобы tests не зависели от system clock.
- Искусственные min/max DOB, manual text parsing, timestamp calculation и generic date-validation
  framework не добавляются.
- GraphQL date type, serialization, timezone semantics и backend error mapping остаются
  backend-gated.

## 22. Edit Profile field validation

**Decision**

Sprint 05 ТЗ задает contract-independent frontend validation независимо от того, какие состояния
показаны в Figma:

- Username обязателен, имеет length `6–30` и допускает Latin letters, digits, `_` и `-`.
- First Name и Last Name обязательны, имеют length `1–50` и допускают Latin/Cyrillic letters.
- Country и City optional; дополнительные length/regex constraints пока отсутствуют.
- About Me optional, имеет maximum length `200` и допускает letters, digits и special characters
  без дополнительного allowlist.
- DOB следует Decision 21.

**Reason**

Figma не является единственным source of truth для validation. Эти правила явно заданы Sprint 05
ТЗ и могут быть реализованы без отсутствующего backend contract.

**Consequences / constraints**

- Required checks trim-aware; empty и whitespace-only required values невалидны.
- Validation не мутирует введенное значение автоматически on blur и не добавляет case
  normalization.
- Signup schema не переносится автоматически; правила остаются feature-local для Edit Profile.
- Backend payload trimming/normalization, GraphQL nullability, username uniqueness и server error
  codes/messages остаются backend-gated.
- Backend audit должен сравнить live constraints с ТЗ. Несовпадение фиксируется как
  `CONTRACT CONFLICT` и выносится на backend/product decision, а не молча меняет frontend rules.
- Не создавать generic validation framework; использовать текущие RHF/validation primitives.
- Tests покрывают boundary lengths и allowed/unsupported character classes для Username и names,
  а также optional и `200/201` boundaries для About Me.

## 23. Edit Profile Save lifecycle

**Decision**

`EditProfileForm` использует стандартный RHF submit lifecycle. `Save Changes` disabled при
`!isDirty`, `!isValid` или `isSubmitting`; submit выполняется только через `handleSubmit`.

Contract-independent form API принимает typed async callback с текущими values. Callback возвращает
фактически сохраненные `EditProfileFormValues`; только successful result вызывает
`reset(savedValues)`.

**Reason**

Обычный RHF lifecycle покрывает dirty/valid/pending/success/failure semantics без отдельной state
machine или global state.

**Consequences / constraints**

- Pending блокирует повторный Save через loading/disabled button, но не блокирует всю форму и не
  сбрасывает введенные values.
- Success делает returned saved values новым RHF baseline; standard `reset` очищает dirty,
  touched/errors.
- Failure сохраняет values, dirty, touched и предыдущий baseline; показывает local form-level error
  и разрешает повторный submit после завершения pending.
- Backend-normalized response, а не исходный optimistic input, становится baseline.
- Field-level backend errors, codes, uniqueness/conflict mapping и production messages остаются
  backend-gated.
- Avatar state/operations не входят в submit, success или reset lifecycle.
- `/settings/profile` не подключает callback к fake API; controlled callbacks допустимы только для
  isolated tests/Storybook до live integration.
- Optimistic fake success, retry manager, submit state machine и global form state не добавляются.

## 24. Edit Profile form values contract

**Decision**

Contract-independent form state имеет один полный UI-oriented shape:

```ts
type EditProfileFormValues = {
  username: string
  firstName: string
  lastName: string
  dateOfBirth: Date | null
  country: string
  city: string
  aboutMe: string
}
```

**Reason**

Полный controlled shape соответствует RHF и существующим Input/Select/DatePicker primitives, не
фиксируя отсутствующий backend DTO.

**Consequences / constraints**

- Все text/select fields всегда `string`; optional `country`, `city`, `aboutMe` используют `''`, не
  `null` или `undefined`.
- `dateOfBirth` является единственным nullable field.
- `defaultValues` всегда содержат полный shape.
- Form state сохраняет пользовательский input без automatic trim/normalization; validation может
  использовать `trim()` только для checks.
- Country/City являются contract-independent UI values, не backend IDs, codes или canonical names.
- Avatar не входит в `EditProfileFormValues`.
- После integration server response явно преобразуется в полный saved form shape; затем
  `reset(savedValues)` устанавливает новый baseline.
- Server → form, form → mutation, empty/null, DOB и location mapping остаются backend-gated.
- Отдельный Profile DTO, domain model, generic mapper и nullable string unions заранее не создаются.

## 25. Country and City options

**Decision**

Contract-independent Edit Profile UI переиспользует существующий `SelectOption` и получает
location options только через props:

```ts
type EditProfileLocationOptions = {
  countryOptions: SelectOption[]
  cityOptionsByCountryValue: Record<string, SelectOption[]>
}
```

**Reason**

В проекте нет подтвержденного geography source, а backend representation неизвестна. Готовых
options и простой зависимости Country → City достаточно для isolated UI без location subsystem.

**Consequences / constraints**

- `SelectOption.value` является opaque UI key, не backend ID, ISO code, canonical name или API
  value.
- `country === ''` означает отсутствие выбора; в этом состоянии `city === ''` и City disabled.
- City показывает options только текущего Country. Если options отсутствуют, City disabled и
  остается `''`.
- Любая смена Country сбрасывает City в `''`; cross-country matching старого City не выполняется.
- Fixtures разрешены только в tests и уже существующем isolated UI environment; они не импортируются
  production route и не становятся production dataset.
- Storybook не добавляется, если его нет в project setup.
- Production dataset, geography dependency/API, async loading/search/pagination/error state, global
  location store и generic async Select manager не добавляются до подтвержденного source.
- Backend audit определяет source, representation, реальную Country → City relation и оба mapping
  directions. Принципиальное отличие contract фиксируется явно и адаптируется на integration
  boundary.

## 26. DOB calendar navigation

**Decision**

Edit Profile переиспользует существующий shared `DatePicker` как controlled `Date | null`. Новый
DOB-specific picker не создается. Popup открывается на selected DOB month либо, при `null`, на
current month из testable `today`.

**Reason**

Это соответствует подтвержденному Figma calendar с month navigation и устраняет hardcoded November
2023 из реального form flow минимальной правкой существующего primitive.

**Consequences / constraints**

- Если current `DatePicker` не поддерживает правильный initial visible month, допускается только
  минимальная общая корректировка primitive, без DOB-specific workaround или rewrite.
- Existing DOB открывает соответствующий month/year; null DOB использует current month/year.
- Остаются только Figma previous/next month controls.
- Year dropdown, year/decade view, manual input, новый picker и date dependency не добавляются без
  product/design confirmation.
- Month-only navigation неудобна для DOB далеко в прошлом; это известная Figma usability limitation
  и отдельный potential follow-up, а не основание самостоятельно расширять UX.
- Future dates не disabled в calendar UI и обрабатываются Edit Profile validation по Decision 21;
  shared API ради этого не расширяется.
- Selection обновляет RHF `Date | null` и сохраняет existing `onTouched` lifecycle.
- API serialization/timezone mapping остаются backend-gated.

## 27. Avatar delete confirmation

**Decision**

Delete control существует только для сохраненного avatar и открывает локальный confirmation modal.
Удаление не optimistic. Contract-independent action имеет UI-oriented signature:

```ts
type OnDeleteAvatar = () => Promise<void>
```

Resolve означает подтвержденное удаление; reject — операция не выполнена.

**Reason**

Figma подтверждает `Delete Photo` modal, а существующие shared `Modal`/`Button` primitives позволяют
повторить простой async confirmation pattern без импорта Post feature или generic manager.

**Consequences / constraints**

- Empty state не показывает delete control; новый draft/preview сам по себе не считается saved
  avatar.
- Open, `No`, close и ordinary dismiss не меняют avatar; dismiss разрешен только вне pending.
- Текущий saved avatar остается видимым до successful resolve.
- Pending блокирует повторный `Yes`, `No`, close/dismiss и concurrent Avatar operations; `Yes`
  показывает loading.
- Success закрывает modal, очищает saved avatar и приводит Avatar draft/operation state к
  согласованному idle/empty state.
- Failure оставляет modal открытым, сохраняет avatar, показывает local error и разрешает retry после
  pending.
- Delete success/failure не меняют Profile form, RHF `isDirty` или baseline.
- Controlled callback допустим в tests/isolated UI; production callback и fake success на
  `/settings/profile` до live contract не подключаются.
- `DeletePostConfirm` feature implementation не импортируется; generic delete manager/framework не
  создается.

## 28. Public data and viewer session boundary

**Decision**

Public Profile/Post SSR является обязательным anonymous baseline. Viewer session — независимое
client-only progressive enhancement для owner controls.

**Reason**

Public routes должны отдавать полный initial HTML без `/me`, а существующий global
`SessionProvider` уже умеет определить viewer после hydration. Эти lifecycles не требуют server
session bridge или общего orchestration layer.

**Consequences / constraints**

- Public routes не используют `ProtectedRouteBoundary`; SSR loaders не получают token, refresh
  cookie или viewer headers и не запрашивают viewer-specific fields.
- SSR и первый client render показывают public content, но скрывают viewer-dependent controls.
- `bootstrapping`, `anonymous` и bootstrap failure сохраняют public content и скрывают controls;
  session failure не становится route-level error.
- Для authenticated viewer Profile owner определяется exact match
  `sessionUser.id === profileUser.id`, Post owner — exact match с authoritative `post.ownerId`.
- Profile owner получает existing Profile Settings; Post owner — только уже поддерживаемые client
  edit/delete actions.
- Session transition меняет только controls: не refetch-ит public query, не меняет `baselineKey` и
  не сбрасывает seeded/public data.
- Follow/Unfollow, Send Message, fake/disabled social controls, SSR auth bridge, duplicate `/me` и
  отдельный viewer provider не добавляются.
- Global Apollo/Session providers не remount-ятся.

## 29. Public Post route topology

**Decision**

Canonical Public Post размещается непосредственно под app shell, а soft navigation из
Main/Profile использует существующий parallel modal slot:

```text
src/app/(app-shell)/
├── posts/[postId]/page.tsx
├── @modal/(.)posts/[postId]/page.tsx
├── @modal/(.)posts/create/page.tsx
├── (protected)/(main)/posts/create/page.tsx
└── (profile)/profile/[userId]/page.tsx
```

**Reason**

Существующий `(app-shell) + @modal` уже поддерживает canonical/intercepted semantics. Перенос
`[postId]` из protected branch делает direct route публичным без нового route group или routing
abstraction.

**Consequences / constraints**

- `/posts/[postId]` доступен anonymous, не использует `ProtectedRouteBoundary`, direct/reload
  показывает standalone Post и закрывается в `/profile/[ownerId]`.
- `@modal/(.)posts/[postId]` публичен, сохраняет underlying Main/Profile и закрывается через
  `router.back()`.
- Оба adapters используют один loader, `InitialPostData`, Apollo seed contract и Post Details;
  различаются только presentation и close strategy.
- `/posts/create` и его existing intercepted flow остаются protected и не меняются.
- Profile cards и текущий Main scope используют soft `/posts/[postId]` navigation; query-param
  routing не добавляется.
- Public Home navigation behavior в Sprint 05 не меняется; новый Post link/modal для него требует
  отдельного requirement.
- `@modal` default/catch-all semantics сохраняются; duplicate modal/navigation abstractions не
  создаются.
- Stale placement в `docs/app-router-roadmap.md` обновляется вместе с реализацией topology, без
  переписывания исторических разделов заранее.

## 30. Public Post technical error boundaries

**Decision**

`loadInitialPost(postId)` возвращает полный `InitialPostData`, возвращает `null` только для
подтвержденного backend not-found signal и бросает обычную controlled technical error для HTTP,
transport, invalid JSON, GraphQL errors или неполного обязательного payload.

**Reason**

Route-local Next error boundaries сохраняют различие resource absence и technical failure и уже
поддерживают повторную загрузку Server Components через Next.js 16.2.4 `unstable_retry()`.

**Consequences / constraints**

- Canonical `null` вызывает `notFound()`; thrown error показывает nearest
  `posts/[postId]/error.tsx` с generic message и Retry.
- Intercepted `null` показывает `Post is unavailable` modal; thrown error обрабатывает boundary
  внутри intercepted segment, сохраняя underlying Main/Profile.
- Intercepted error modal Retry использует `unstable_retry()`, Close — `router.back()`.
- Unknown GraphQL error не считается not-found; backend mapping null/error подтверждается отдельным
  live audit.
- Retry является explicit новым server request; successful retry формирует новый complete baseline.
- Null/error load не seed-ит Apollo cache; seed выполняется только для complete success.
- Пользователю не показываются technical details или digest.
- Route error files остаются тонкими presentation adapters; custom error hierarchy/platform не
  создается.

## 31. Atomic Profile GraphQL operation

**Decision**

Initial Profile SSR выполняет один raw GraphQL POST с одной combined `initialProfileQuery`, которая
получает `user`, подтвержденные public counters и first `profilePosts` page.

```ts
type InitialProfileVariables = {
  userId: string
  postsInput: {
    first: number
    userId: string
  }
}
```

**Reason**

GraphQL поддерживает несколько root fields в одной operation и напрямую выполняет подтвержденные
atomic payload и one-request regression requirements без orchestration нескольких requests.

**Consequences / constraints**

- `postsInput` создается общим first-page variables factory; `after` отсутствует как property и не
  передается `null`.
- Query использует общие fragments только при реальном уменьшении duplication и явно включает
  необходимые `__typename` в document, который печатает raw server transport.
- Profile first-page field arguments/selection cache-compatible с client `profilePostsQuery`.
- `user === null` означает not-found. GraphQL errors, missing counters, missing posts или другой
  incomplete payload означают technical failure.
- Partial result не используется и не seed-ится.
- Complete seed выполняет один `writeQuery(initialProfileQuery, data, variables)`; последующий
  `profilePostsQuery(cache-first)` читает тот же `ROOT_QUERY.profilePosts(...)` field.
- `fetchMore` и polling остаются на existing `profilePostsQuery` и сохраняют local pagination
  ownership.
- Несколько initial fetch, `Promise.all`, batching, Apollo server client и SSR
  repository/orchestration services не добавляются.
- Counters fields появляются только после live audit. Невозможность получить обязательный payload
  одной operation фиксируется как `CONTRACT CONFLICT / BACKEND BLOCKER`, а one-request requirement
  не ослабляется молча.

## 32. Apollo seed readiness lifecycle

**Decision**

Profile и Post используют небольшие локальные route-level client seed boundaries. Boundary получает
существующий global client через `useApolloClient()`, выполняет `writeQuery` в `useEffect` и хранит
readiness как `seededBaselineKey: string | null`.

**Reason**

Effect сохраняет React render чистым, а comparison с server `baselineKey` не позволяет Profile
query активироваться против старого cache baseline при hydration или `router.refresh()`.

**Consequences / constraints**

- Новый Apollo Client/Provider и global hydration state не создаются.
- Cache writes не выполняются during render, state initializer или `useLayoutEffect`.
- Пока `seededBaselineKey !== initialData.baselineKey`, Profile использует `skipToken` и продолжает
  показывать public UI из server props/local baseline.
- Effect сначала синхронно выполняет complete `writeQuery`, затем отмечает текущий baseline seeded.
- Следующий render активирует `profilePostsQuery` с `cache-first` и `pollInterval: 60_000`; cache
  read не создает initial network request.
- Новый server baseline сразу возвращает query в `skipToken`, затем seed-ит новый payload и только
  после этого повторно активирует query.
- StrictMode может повторить idempotent `writeQuery`, но не создает network request или новый
  baseline/client.
- Post boundary seed-ит normalization/query cache, но Post Details остается на
  `initialPost/displayPost` и не добавляет `useQuery(postQuery)`.
- Failed/incomplete SSR payload до seed boundary не доходит.
- Generic seed provider/manager не создается; локальные boundaries обобщаются только при очевидной
  фактической duplication.

## Open decisions / audit queue

Ниже перечислены неподтвержденные пункты для продолжения общего audit. Они не являются Decisions
или Sprint 05 facts до отдельного confirmation.

1. Atomic Public Profile route-local error/Retry и loading/streaming semantics: real 404 для
   `user === null`, technical error boundary, Next 16.2.4 `unstable_retry()` и допустимость
   `loading.tsx`/Suspense до resource classification.
2. Public Profile render ownership для `user` и counters после SSR, включая их поведение при
   client mutations и `router.refresh()` без второго initial query.
3. Main/Profile Post soft-navigation component boundary: сделать Main cards clickable, сохранить
   Public Home behavior и оставить `returnTo` только safe fallback, не routing mechanism.
4. Public Profile/Post metadata/SEO scope и его совместимость с one-request/no-store SSR guarantee.
5. Avatar browser decode failure и orientation/coordinate semantics для source-pixel crop без
   magic-byte validation или premature export pipeline.
6. Завершение targeted Figma audit: оставшиеся concrete frames, reuse existing primitives,
   responsive/presentation gaps и явная фиксация MCP/design limitations.

После этих шести пунктов общий audit можно закрыть. Live schema, counters, Edit Profile/Avatar
mutations, missing-resource signal, author shape и upload contract проверяются отдельным
backend-contract audit и в число шести general decisions не входят.
