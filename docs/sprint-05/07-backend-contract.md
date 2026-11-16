# Редактирование профиля — контракт для фронтенда

## Проверка источников на 2026-11-14

Backend dev `3b151ac96f1f1cd075a264eb63d30ef0a443f497`, frontend dev `75cf9ff`.
Контракты сверены с backend code-first decorators/resolvers и frontend-кодом в аудите c98df50.
Backend #31/#32/#34 merged 11 ноября, #35 — 12 ноября. Main `c30764d` отстаёт;
merge в dev не подтверждает production deploy. Текущий gateway/composed SDL, миграции/seed
и frontend live-приёмка не проверены. Ниже описана реализация в dev, не результат production API calls.

| Область                         | Реализовано в backend dev                                                                                                                                                                                                                                                                                              | Остаток / неподтверждённое                                                                                                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile counters                | В public User/types/resolvers нет publicationsCount/followersCount/followingCount. usersCount не замена.                                                                                                                                                                                                               | UI-решение «—» ещё не подключено; не запрашивать несуществующие поля и не писать fake значения в cache. SSR D1.3–D1.6 не блокировать; реальные counters — будущая интеграция.                                                                              |
| profilePosts                    | Cursor ISO(createdAt) + `_` + id, порядок createdAt DESC/id DESC, owner/deletedAt filter, limit+1; after — строго меньшая пара date/id. Строка cursor может быть удалена.                                                                                                                                              | Live insert/delete/polling, malformed/foreign cursor на целевом gateway; frontend cursor не парсит.                                                                                                                                                        |
| Country/City                    | [#28](https://github.com/ItIncTeam/picboard-back/pull/28) merged: resolver/handlers/repositories, migration/seed. countries(search: String) без limit, name ASC; cities(countryId: ID!, search: String, limit: Int = 20), clamp 1–50. Prefix name/nameRu case-insensitive, города population DESC NULLS LAST/name ASC. | Frontend lookup/wiring отсутствует (D3.3), saved values disabled. Production deploy/seed не подтверждены.                                                                                                                                                  |
| Me/updateProfile                | [#31](https://github.com/ItIncTeam/picboard-back/pull/31) merged: updateProfile → Me, profile fields, validation/repository. Frontend D1.7/D1.8/D3.7 реализованы.                                                                                                                                                      | Production session/save не приняты; точечная сверка validation/errors. Me перед submit — OPEN UX decision.                                                                                                                                                 |
| Public User                     | #31: aboutMe вместо удалённого bio, nullable firstName/lastName, вычисляемый displayName. Приватные account fields в User не добавлены.                                                                                                                                                                                | usersApi frontend ещё запрашивает bio: несовместим с текущим backend dev. Исправить selection/тип/чтение, согласовать rollout. Это не общий rename всех типов.                                                                                             |
| Post.author / partial responses | [#35](https://github.com/ItIncTeam/picboard-back/pull/35) merged: Post.author nullable. Resolver отсутствующего User может дать data + errors, не уничтожая остальные данные.                                                                                                                                          | Frontend D2.8 (FRONT-180) реализован: nullable types/validator, fallback UI/metadata, errors.path до display/cache. Production поведение не проверено.                                                                                                      |
| Avatar upload                   | [#27](https://github.com/ItIncTeam/picboard-back/pull/27) merged: initiateUploadBatch с AVATAR → PUT → completeUpload; retryUpload перевыдаёт upload URL по правилам retry. 1 файл, JPEG/PNG, ≤10 MiB; complete проверяет size/type/magic bytes, возвращает READY либо FAILED/retryable.                               | Frontend D3.8: export/API/orchestration и mock-тесты реализованы; wiring в Settings ожидает согласования с Country/City. Уточнить export dimensions/MIME/quality, точные PUT headers и production rollout. B-8 не считать готовым изменением Content-Type. |
| Avatar set/replace              | [#32](https://github.com/ItIncTeam/picboard-back/pull/32) merged: setProfilePhoto(fileId: ID!): User!, owned READY AVATAR; UUID v4; row lock и outbox старого файла. Тот же fileId не ставит файл на удаление.                                                                                                         | Frontend service передаёт только READY fileId, refetches Me и guarded-sync; Settings wiring ожидает согласования. Production: files-service перед users, FILES_TCP_HOST/PORT и users outbox migration. Автоматическое применение миграций не подтверждено. |
| Avatar delete                   | [#34](https://github.com/ItIncTeam/picboard-back/pull/34) merged: deleteProfilePhoto: Boolean!, без аргументов; owner из токена. Row lock, avatar null + outbox в транзакции. Без аватара — true без записи.                                                                                                           | Frontend service refetches Public User и Me после Boolean, затем guarded-sync; Settings wiring и production delete/outbox не подтверждены.                                                                                                                 |

Исходники backend dev:
[User](https://github.com/ItIncTeam/picboard-back/blob/3b151ac96f1f1cd075a264eb63d30ef0a443f497/apps/users-microservice/src/graphql/types/user.type.ts),
[Me](https://github.com/ItIncTeam/picboard-back/blob/3b151ac96f1f1cd075a264eb63d30ef0a443f497/apps/users-microservice/src/graphql/types/me.type.ts),
[LocationResolver](https://github.com/ItIncTeam/picboard-back/blob/3b151ac96f1f1cd075a264eb63d30ef0a443f497/apps/users-microservice/src/graphql/resolvers/location.resolver.ts),
[Avatar mutations](https://github.com/ItIncTeam/picboard-back/blob/3b151ac96f1f1cd075a264eb63d30ef0a443f497/apps/users-microservice/src/graphql/resolvers/users.resolver.ts),
[PostEntity](https://github.com/ItIncTeam/picboard-back/blob/3b151ac96f1f1cd075a264eb63d30ef0a443f497/apps/posts-microservice/src/posts/entities/post.entity.ts),
[profilePosts repository](https://github.com/ItIncTeam/picboard-back/blob/3b151ac96f1f1cd075a264eb63d30ef0a443f497/apps/posts-microservice/src/infrastructure/prisma/prisma-posts.repository.ts),
[Edit Profile contract](https://github.com/ItIncTeam/picboard-back/blob/3b151ac96f1f1cd075a264eb63d30ef0a443f497/md-files/frontend-profile-edit-contract-ru.md).
Backend markdown тоже содержит старые статусы Avatar; реализация подтверждена resolver/use-case кодом и merged PR.

### File.url и partial GraphQL responses

User.avatar nullable. У File.url в dev расходятся `@Field()` в File type и nullable
`ResolveField` в FilesResolver. Историческое String!/TTL 900 секунд нельзя выдавать за
проверку текущего gateway: нужен composed SDL и приёмка. Frontend типы не менять по догадке,
signed URL использовать только для отображения, без timer/refresh-manager.

Post.author nullable независимо от этой неопределённости. Для post/feed/profilePosts возможны
data + errors: D2.8 проверяет author-related errors.path и полноту обязательных данных, разрешает
fallback без ссылки автора. Остальные ошибки остаются техническими; post null с errors не 404.
Не включать errorPolicy: all без классификации и проверки payload (решение 30).

### Avatar flow и синхронизация

После Save: export → initiateUploadBatch(AVATAR) → PUT → completeUpload → только READY
передавать в setProfilePhoto. RetryUpload применяется по retryable-состоянию upload, а не как attach.
Set/replace owner-only; файл чужой/not READY/не AVATAR отклоняется одинаковым Invalid file id.
Delete owner-only и идемпотентный, не требует upload или fileId. Старый файл удаляет backend outbox;
возвращать старые fileId из outbox как способ undo нельзя: известен риск их последующего удаления.

`User:<id>` и `Me:<id>` — разные cache records. После set обновить публичный User проверенным
mutation payload; после delete перечитать публичный User. После обеих mutations перечитать Me
и применить существующий guarded session synchronizer, захваченный до mutation.
Защитить записи от смены сессии;
не синтезировать Me из User/Boolean. При сбое sync не объявлять mutation неисполненной:
повторить чтение, не запускать upload заново. RHF draft не сбрасывать.
Это план D3.8, не текущая реализация. Правило updateProfile «без второго Me» к Avatar не относится.

### Открытые вопросы и rollout

1. Установить фактический production SHA, получить composed SDL и подтвердить совместимый rollout
   aboutMe/Me, nullable author и Avatar. Не считать backend dev SHA развёрнутым автоматически.
2. Реальные profile counters: будущие SDL/semantics/срок; до этого UI «—» и SSR без их ожидания.
3. Подтвердить миграции/seed Country/City и cursor/polling на целевом gateway.
4. Подтвердить Avatar export dimensions/MIME/quality, PUT headers/retry, File.url nullability/TTL,
   работу outbox и cleanup unattached files; порядок files → users и env/migration из #32.
5. **OPEN UX decision:** backend docs требуют перечитывать Me перед submit долго открытой формы
   из-за last-write-wins обязательных полей. Текущий frontend этого не делает; существующий
   dirtyFields flow сохраняется. Не объявлять pre-submit refetch реализованным и не вводить version API.

---

## 1. Endpoint и авторизация

```
POST https://gateway.picboard.space/api/v1
Content-Type: application/json
Authorization: Bearer <accessToken>
```

- Мутация **требует** Bearer-токен. Анонимный вызов → ошибка `UNAUTHENTICATED` (`statusCode: 401`).
- Владелец профиля берётся **из токена**; `userId`/`ownerId` в input не передаётся и не принимается.
- Смена `username` **не разлогинивает**: в JWT username нет, токен остаётся валидным.

---

## 2. Мутация

```graphql
mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    id
    username
    email
    isConfirmed
    firstName
    lastName
    displayName
    dateOfBirth
    aboutMe
    profilePictureFileId
    avatar {
      id
      url
    }
    countryId
    cityId
    country {
      id
      code
      name
      nameRu
    }
    city {
      id
      name
      nameRu
    }
  }
}

input UpdateProfileInput {
  username: String! # обязательно всегда
  firstName: String! # обязательно всегда
  lastName: String! # обязательно всегда
  dateOfBirth: String # ISO "YYYY-MM-DD", опционально
  countryId: ID # опционально
  cityId: ID # опционально
  aboutMe: String # опционально, 0..200
}
```

Возвращает **тот же read-model, что `me`** — после сохранения второй запрос не нужен,
ответ применяется существующим guarded synchronizer к Me cache/session.
Это правило updateProfile; Avatar возвращает другие payload и требует отдельного чтения Me.

---

## 3. Правила полей

| Поле          | Обязательно | Правила                                                                            | Сообщение при ошибке                                                            |
| ------------- | ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `username`    | **да**      | 6–30 символов, `^[A-Za-z0-9!_-]+$`, уникален                                       | `Username must be 6–30 characters: letters, digits, !, _ or -`                  |
| `firstName`   | **да**      | 1–50, латиница/кириллица, минимум одна буква, пробел, дефис, апостроф              | `Only letters, spaces, hyphens and apostrophes`                                 |
| `lastName`    | **да**      | то же                                                                              | то же                                                                           |
| `dateOfBirth` | нет         | строго `YYYY-MM-DD`, существующая календарная дата, не в будущем, **возраст ≥ 13** | `dateOfBirth must be in YYYY-MM-DD format` / `DATE_IN_FUTURE` / `USER_UNDER_13` |
| `countryId`   | нет         | UUID страны, должен существовать                                                   | `countryId must be a UUID` / `Country not found`                                |
| `cityId`      | нет         | UUID города, должен существовать **и принадлежать** стране                         | `CITY_NOT_IN_COUNTRY` / `City not found`                                        |
| `aboutMe`     | нет         | 0–200 символов                                                                     | `aboutMe must be shorter than or equal to 200 characters`                       |

Строки триммятся до валидации. DOB проверяется в порядке: формат YYYY-MM-DD →
существование календарной даты → DATE_IN_FUTURE → USER_UNDER_13. Пустой aboutMe после trim
сохраняется как null, не пустая строка.

---

## 4. «Очистить» vs «не менять»

Для опциональных полей (`dateOfBirth`, `countryId`, `cityId`, `aboutMe`):

| Хотите             | Что слать                                |
| ------------------ | ---------------------------------------- |
| Не менять значение | поле **не передавать** (или `undefined`) |
| Очистить           | `field: null`                            |

> `null` очищает поле; отсутствие/undefined оставляет значение. Frontend сохраняет dirtyFields:
> обязательные строки отправляются всегда, optional — только изменённые.

Локация:

- `countryId: null` → город **очищается автоматически** (`cityId` тоже станет `null`);
- смена страны **без** `cityId` → город тоже очищается (старый город может не принадлежать новой стране);
- `cityId` без `countryId` → валидация идёт против страны, которая уже сохранена у пользователя;
  если страны нет — ошибка `Country must be set together with city`.

При изменении country или city отправлять **оба countryId/cityId** (ID или null).
Если локация не менялась, опускать оба поля по dirtyFields, включая disabled saved location.

---

## 5. Ошибки

### 5.1. Формат

Ошибки всегда в стандартном GraphQL-конверте:

```json
{
  "errors": [
    {
      "message": "…",
      "extensions": {
        "code": "USER_UNDER_13",
        "statusCode": 400,
        "errors": [{ "field": "dateOfBirth", "message": "Age must be at least 13" }]
      }
    }
  ]
}
```

- `extensions.code` — **по нему и ветвитесь**;
- `extensions.statusCode` — HTTP-семантика ошибки (401/400/…);
- `extensions.errors[]` — детали по полям (`field` = имя поля GraphQL, camelCase).

### 5.2. Коды

| Ситуация                                                  | HTTP ответа | `extensions.code`           | `statusCode` | `extensions.errors[]`                                                           |
| --------------------------------------------------------- | ----------- | --------------------------- | ------------ | ------------------------------------------------------------------------------- |
| Успех                                                     | 200         | —                           | —            | —                                                                               |
| Нарушено правило поля (длина, regex, UUID, дата, >200)    | **200**     | `BAD_USER_INPUT`            | 400          | `[{ field, message }]`                                                          |
| Возраст < 13                                              | **200**     | `USER_UNDER_13`             | 400          | `[{ field: "dateOfBirth", … }]`                                                 |
| Дата рождения в будущем                                   | **200**     | `DATE_IN_FUTURE`            | 400          | `[{ field: "dateOfBirth", message: "Date of birth cannot be in the future." }]` |
| `username` занят                                          | **200**     | `USERNAME_TAKEN`            | 409          | `[{ field: "username", … }]`                                                    |
| Город из другой страны                                    | **200**     | `CITY_NOT_IN_COUNTRY`       | 400          | `[{ field: "cityId", … }]`                                                      |
| Город без страны                                          | **200**     | `BAD_USER_INPUT`            | 400          | `[{ field: "cityId", message: "Country must be set together with city" }]`      |
| Город не найден                                           | **200**     | `BAD_USER_INPUT`            | 400          | `[{ field: "cityId", message: "City not found" }]`                              |
| Страна не найдена                                         | **200**     | `BAD_USER_INPUT`            | 400          | `[{ field: "countryId", message: "Country not found" }]`                        |
| Нет/просрочен токен                                       | **200**     | `UNAUTHENTICATED`           | 401          | `null`                                                                          |
| Не передан обязательный `firstName`/`lastName`/`username` | **400**     | `BAD_USER_INPUT`            | 400          | `null` (ошибка GraphQL-валидации запроса)                                       |
| Неизвестное поле в selection set (`bio` и т.п.)           | **400**     | `GRAPHQL_VALIDATION_FAILED` | 400          | `null`                                                                          |

⚠️ **Не полагайтесь на HTTP-статус ответа.** Ошибки исполнения приходят с HTTP **200**,
а HTTP 400 бывает только у ошибок _валидации самого запроса_ (не передали обязательное поле,
запросили несуществующее поле). Единственный надёжный признак — `errors` в теле и
`extensions.code`.

⚠️ **`USERNAME_TAKEN` приходит с `statusCode: 409`** (конфликт), остальные доменные коды — с `400`.
Но всё равно ветвитесь по `code`: `statusCode` — это HTTP-семантика, а не бизнес-различие.

### 5.3. Примеры

Возраст < 13:

```json
{
  "errors": [
    {
      "message": "A user under 13 cannot create a profile.",
      "extensions": {
        "code": "USER_UNDER_13",
        "statusCode": 400,
        "errors": [{ "field": "dateOfBirth", "message": "Age must be at least 13" }]
      }
    }
  ]
}
```

`aboutMe` длиннее 200:

```json
{
  "errors": [
    {
      "message": "aboutMe must be shorter than or equal to 200 characters",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "statusCode": 400,
        "errors": [
          {
            "field": "aboutMe",
            "message": "aboutMe must be shorter than or equal to 200 characters"
          }
        ]
      }
    }
  ]
}
```

---

## 6. Пример успешного запроса и ответа

```graphql
mutation {
  updateProfile(
    input: {
      username: "john_doe"
      firstName: "John"
      lastName: "Doe"
      dateOfBirth: "2000-05-17"
      countryId: "43152b5a-5d0f-4703-8a5a-bb0a14a2d69f"
      cityId: "9c4dbd5f-0010-4b60-b579-f9f668d7a831"
      aboutMe: "Backend dev, Berlin"
    }
  ) {
    id
    username
    firstName
    lastName
    displayName
    dateOfBirth
    aboutMe
    countryId
    cityId
    country {
      name
      nameRu
    }
    city {
      name
      nameRu
    }
  }
}
```

```json
{
  "data": {
    "updateProfile": {
      "id": "5124433e-e432-44e0-b1ba-da447d6505f0",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "dateOfBirth": "2000-05-17",
      "aboutMe": "Backend dev, Berlin",
      "countryId": "43152b5a-5d0f-4703-8a5a-bb0a14a2d69f",
      "cityId": "9c4dbd5f-0010-4b60-b579-f9f668d7a831",
      "country": { "name": "Germany", "nameRu": "Германия" },
      "city": { "name": "Berlin", "nameRu": "Берлин" }
    }
  }
}
```

Очистка локации (`countryId: null` → город тоже `null`), сокращённый ответ:
DOB/About Me без их передачи не меняются; displayName не зависит от локации.

```json
{
  "data": {
    "updateProfile": {
      "countryId": null,
      "cityId": null,
      "displayName": "John Doe"
    }
  }
}
```

---

## 7. Prefill формы: `me`

```graphql
query Me {
  me {
    id
    email
    username
    isConfirmed
    firstName
    lastName
    displayName
    dateOfBirth
    aboutMe
    profilePictureFileId
    avatar {
      id
      url
    }
    countryId
    cityId
    country {
      id
      code
      name
      nameRu
    }
    city {
      id
      name
      nameRu
    }
  }
}
```

Этого достаточно, чтобы заполнить форму целиком — отдельный запрос справочника для
инициализации не нужен (`country`/`city` приходят объектами).

Справочники (для селектов): `countries(search)` — весь список (~250, грузить один раз в кэш),
`cities(countryId, search, limit)` — автокомплит, debounce ≈ 250 мс, `limit` максимум 50.

`displayName` — **вычисляемый** (`firstName` + `lastName`, fallback → `username`), в БД его нет;
менять его напрямую нельзя.

---

## 8. Чек-лист для формы

- [ ] Всегда отправлять `username`, `firstName`, `lastName` (обязательные).
- [ ] Опциональные поля: не передавать = не менять; `null` = очистить.
- [ ] При изменении локации отправлять пару countryId/cityId (ID или null); иначе опускать оба.
- [ ] Смена страны в UI → сбросить выбранный город и отправить новый `countryId` + `cityId`.
- [ ] Ветвиться по `extensions.code`, а не по HTTP-статусу и не по тексту `message`.
- [ ] Field-ошибки из `extensions.errors[]` вешать на конкретные инпуты по `field`.
- [ ] `USER_UNDER_13` → показать ссылку на Privacy Policy (требование ТЗ).
- [ ] `USERNAME_TAKEN` → username; `DATE_IN_FUTURE` → dateOfBirth; `Country not found` → country.
- [ ] Пустой aboutMe после trim → null. Pre-submit Me refetch остаётся OPEN UX decision.
- [ ] После успеха — обновить кэш `me` из ответа мутации (без второго запроса).
- [ ] Не передавать `userId`/`ownerId`.

---

## 9. Статус интеграций

| Возможность                  | Backend dev             | Frontend / production                                                                |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Avatar upload/set/delete     | Реализованы #27/#32/#34 | D3.8 export/API/orchestration реализованы; Settings wiring и rollout не подтверждены |
| Country/City                 | Реализованы #28         | D3.3 lookup/wiring отсутствует; deploy/seed не подтверждены                          |
| Profile counters             | Недоступны              | UI «—» запланирован, SSR не блокировать                                              |
| Follow/unfollow, isFollowing | Следующая фича          | Не входят в эту интеграцию                                                           |
| Public User aboutMe          | #31 merged, bio удалён  | usersApi ещё запрашивает bio; нужна совместимость                                    |
| Nullable Post.author         | #35 merged              | D2.8 (FRONT-180) реализован                                                          |

---

## 10. Известные нюансы бэкенда (для понимания, не для обхода)

1. `countryId`/`cityId` валидируются как UUID v4. Значения из наших справочников всегда v4.
2. Кэп `limit` у `cities`: 20 по умолчанию, максимум 50, минимум 1.
3. `updateProfile` возвращает Me; email/isConfirmed доступны владельцу и приходят только при выборе в selection.
4. Ограничение «возраст ≥ 13» считается по **UTC-дате**: `dateOfBirth` в UTC-полуночи,
   сравнение тоже в UTC — в день рождения возраст уже «полный».
