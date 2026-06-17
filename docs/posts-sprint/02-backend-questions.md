# Backend Questions For Posts Sprint

Этот документ фиксирует вопросы к backend. Frontend не придумывает contract и не добавляет GraphQL
operations до ответов.

## Upload contract

- Подтвердите exact presigned URL request contract: query/mutation name, input and response shape.
- Какие HTTP method, headers and content type должен использовать frontend при `PUT` в storage?
- Какой expiry у presigned URL и можно ли запрашивать URL batch для нескольких изображений?
- Upload выполняется до `createPost`; подтвердите, какая metadata mutation сохраняет uploaded file.
- Какой metadata payload frontend передает после storage upload: url, key, file name, content type,
  size, width/height, order?
- Как `createPost` ссылается на сохраненную metadata: media IDs, storage keys или ordered media
  inputs?
- Нужно ли отдельно подтверждать upload completion?
- Нужна ли retry/idempotency strategy для failed upload?
- Какие error codes/messages возвращаются для invalid file, too large, unsupported type, auth
  failure и storage failure?
- Нужен ли progress reporting contract?

Confirmed frontend assumption:

- GraphQL Upload/multipart для media files не используется.
- Frontend uploads final edited `File` directly to storage with presigned URL.
- GraphQL используется после storage upload для сохранения metadata and later `createPost`.

## File format, limits and order

- Какие форматы разрешены: JPEG, PNG, WebP?
- Нужен ли preserve original format или backend ожидает единый output format?
- Максимальный размер файла после crop/filter?
- Максимальное количество изображений в одном post?
- Максимальные width/height изображения?
- Нужно ли сохранять порядок изображений как отправил frontend?
- Кто генерирует thumbnails: frontend или backend?
- Нужно ли хранить original image или только final processed image?

## `createPost`

- Как называется mutation?
- Какие поля обязательны: files/media IDs, caption, hashtags, location, visibility?
- Какой max length для caption?
- Как передавать hashtags: parsed array или raw caption text?
- Возвращает ли mutation полный `Post` или только ID/status?
- Какая модель ошибок для partial upload success but createPost failure?
- Что делать, если metadata сохранена, но `createPost` завершился ошибкой: cleanup, orphan media,
  retry или draft-like recovery?
- Нужна ли optimistic update support?

## `updatePost`

- Можно ли редактировать только caption/hashtags или media тоже?
- Если media можно менять, это replace all или patch operations?
- Есть ли ограничения по времени после публикации?
- Как backend валидирует ownership?
- Что возвращает mutation после update?

## `deletePost`

- Delete hard или soft?
- Нужен ли reason?
- Что происходит с media files после delete?
- Какой response shape: deleted ID, success boolean, deleted post?
- Как должны инвалидироваться profile/main/feed queries?

## `getPostById`

- Как называется query?
- Доступен ли post неавторизованному пользователю?
- Какие поля входят в details: owner, media, caption, createdAt, updatedAt, likes/comments counters?
- Какие ошибки: not found, forbidden, deleted?
- Нужно ли возвращать viewer-specific fields: likedByMe, canEdit, canDelete?

## `getUserPosts`

- Query принимает user ID, username или `me` flag?
- Нужна ли отдельная query для own posts?
- Какие поля нужны для grid card?
- Как работает pagination?
- Можно ли сортировать posts?
- Нужны ли private/draft/deleted filters?

## `getPublicPosts`

- Query для public main page возвращает exactly 4 latest posts или принимает `limit: 4`?
- Какие поля доступны public user без auth?
- Должны ли public posts учитывать moderation/visibility?
- Нужен ли SSR/ISR friendly cache policy?

## `getRegisteredUsersCount`

- Это отдельная query или поле в public stats query?
- Возвращается точное число или approximate count?
- Как часто число может кэшироваться?
- Доступно ли без auth?

## Pagination

- Cursor-based или offset-based?
- Какой default и maximum page size?
- Есть ли `hasNextPage`, `endCursor`, `totalCount`?
- Как обрабатывать deleted posts внутри pagination window?
- Нужна ли stable ordering guarantee?

## Public access

- Какие post routes доступны anonymous users?
- Public main page должна ходить в тот же GraphQL endpoint?
- Нужны ли auth-optional viewer fields?
- Как backend различает public/private visibility?
- Какие cache headers или ISR revalidate expectations?
