# Редактирование профиля — контракт для фронтенда

## Проверка источников на 2026-11-11

Этот документ хранит предоставленный контракт Edit Profile; прежнее утверждение «уже реализован
и проверен live» не подтверждает merge или deploy. В этом аудите live gateway не проверялся.
Backend доступен; проверен dev `eafa64dd05ba291156642ea97c380d593de04d08`, main
`c30764da8f597bf0d21213ed318410174495ef4e` существенно отстаёт. Feature-ветки не равны dev.
Сохранённые ниже примеры относятся к контракту profile-edit, а не к текущему backend dev.

| Область               | Подтверждённый контракт / реализация                                                                                                                                                                                                                                                                                                                                                         | Чего не подтверждено                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile counters      | В проверенных public User/types/resolvers dev нет publicationsCount/followersCount/followingCount. Backend profile docs относят к следующей фиче. usersCount — общий счётчик пользователей, не замена.                                                                                                                                                                                       | SDL, nullability, semantics и срок поставки всех трёх counters. Блокирует полный атомарный SSR по решениям 4/7.                                                                    |
| profilePosts          | dev `posts.resolver.ts` формирует cursor ISO(createdAt) + `_` + id; `prisma-posts.repository.ts` сортирует createdAt DESC, id DESC, фильтрует owner/deletedAt, выбирает limit+1; after — строго меньшая пара date/id. Удалённая строка cursor не требуется для фильтрации.                                                                                                                   | Гарантия сохранения этой семантики при rollout, ошибки malformed/foreign cursor и live сценарии insert/delete/polling. Frontend cursor не парсит. Это не отсутствующая реализация. |
| Country/City          | [#28](https://github.com/ItIncTeam/picboard-back/pull/28) merged 22 октября. LocationResolver + query handlers + Prisma repositories + migration/seed есть в dev. countries(search: String) без limit, все страны по name ASC; cities(countryId: ID!, search: String, limit: Int = 20), clamp 1–50. Prefix search name/nameRu case-insensitive, города population DESC NULLS LAST, name ASC. | Применены ли миграция/seed на целевом gateway; возвращает ли deployed schema этот контракт. Не считать BLOCKED по отсутствию API.                                                  |
| Me/updateProfile      | [#31](https://github.com/ItIncTeam/picboard-back/pull/31) OPEN, head `1fba26d9de97fda1847dc45df403ef42dafd94ea`. Есть ProfileResolver/updateProfile → Me, use case, validation, repository и тесты в ветке. dev Me ещё содержит bio и не содержит firstName/lastName/dateOfBirth/aboutMe, нужных frontend #194.                                                                              | Merge/deploy, composed SDL, live session/save. Frontend код DONE не означает production-ready.                                                                                     |
| Public User           | dev содержит bio; #31 заменяет его на aboutMe и добавляет firstName/lastName. Frontend usersApi пока запрашивает bio — совместим с dev, но сломается после такого rollout #31.                                                                                                                                                                                                               | Совместимый порядок выпуска frontend/backend. Не переименовывать поля заранее по догадке.                                                                                          |
| Avatar upload         | [#27](https://github.com/ItIncTeam/picboard-back/pull/27) merged 16 октября. dev поддерживает AVATAR в initiateUploadBatch → PUT → completeUpload/retryUpload. Policy: 1 файл, JPEG/PNG, ≤10 MiB; complete проверяет size/type/magic bytes и отдаёт READY либо FAILED/retryable.                                                                                                             | Deploy на gateway, итоговые размеры/кодирование crop, точные PUT headers и rollout изменения Content-Type (B-8 — задача, не готовый контракт).                                     |
| Avatar attach/replace | [#32](https://github.com/ItIncTeam/picboard-back/pull/32) OPEN, head `8e539975069ca0fddb20c1b6162c63c5312e4b11`. В ветке setProfilePhoto(fileId: ID!): User, проверка owned READY AVATAR, row lock и outbox старого файла. Общий outbox уже merged #30.                                                                                                                                      | Нет в dev; payload — Public User, не Me. Требуются финальный SDL/ошибки/rollout files перед users и способ session/cache sync без выдуманного Me.                                  |
| Avatar delete         | B-4 описывает deleteProfilePhoto и idempotency; в просмотренном dev и diff #32 реализации mutation нет.                                                                                                                                                                                                                                                                                      | Реальная signature/payload/error codes, merge/deploy, retry и конкурентный replace/delete.                                                                                         |

Исходники зафиксированного backend dev:
[LocationResolver](https://github.com/ItIncTeam/picboard-back/blob/eafa64dd05ba291156642ea97c380d593de04d08/apps/users-microservice/src/graphql/resolvers/location.resolver.ts),
[Me](https://github.com/ItIncTeam/picboard-back/blob/eafa64dd05ba291156642ea97c380d593de04d08/apps/users-microservice/src/graphql/types/me.type.ts),
[User](https://github.com/ItIncTeam/picboard-back/blob/eafa64dd05ba291156642ea97c380d593de04d08/apps/users-microservice/src/graphql/types/user.type.ts),
[profilePosts repository](https://github.com/ItIncTeam/picboard-back/blob/eafa64dd05ba291156642ea97c380d593de04d08/apps/posts-microservice/src/infrastructure/prisma/prisma-posts.repository.ts),
[Avatar policy](https://github.com/ItIncTeam/picboard-back/blob/eafa64dd05ba291156642ea97c380d593de04d08/apps/files-microservice/src/files/files.constants.ts).
Checked-in composed SDL не найден в дереве dev; контракт восстановлен по code-first decorators
и resolver/use-case коду. Output nullability нельзя объявлять live-проверенной.
В частности, историческое File.url: String! расходится с nullable ResolveField в dev FilesResolver:
нужен composed SDL, не менять frontend типы вслепую.

### Конкретные ответы от backend

1. Какой SHA развёрнут на gateway? Когда merge/deploy #31 и как согласовать breaking bio → aboutMe
   для user/feed.author/post.author и новый Me? Дать composed SDL и подтвердить save/session.
2. Дать контракт трёх profile counters и срок поставки; можно ли получить их с user+profilePosts
   одним anonymous запросом? До ответа полный D1.3–D1.5 не закрывать.
3. Подтвердить rollout/seed Country/City #28 и ordering/cursor rules выше; как отвечать на invalid
   cursor? Не требовать нового API, уже реализованного в dev.
4. Когда #32 будет merged/deployed? Как выглядит финальный setProfilePhoto payload и как обновить
   Me без неподтверждённого refetch/синтетического session object? Когда появится deleteProfilePhoto?
5. Каковы export dimensions/MIME/quality, PUT Content-Type/headers и retry policy для Avatar?
   Подтвердить File.url nullability/TTL на gateway. Cleanup unattached files — ответственность backend.
6. В #31 появился DATE_IN_FUTURE: подтвердить код в deployed API. Требование перечитывать Me перед
   submit из новых docs #31 расходится с согласованным frontend flow без лишнего Me: отдельно
   согласовать поведение старой формы/last-write-wins, не добавлять refresh или version API догадкой.

Ниже — сохранённый контракт profile-edit. Его правила применяются после подтверждения rollout;
тестовые цифры из прежней версии документа не являются результатом этого аудита.

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
можно писать ответ сразу в кэш.

---

## 3. Правила полей

| Поле          | Обязательно | Правила                                                    | Сообщение при ошибке                                                     |
| ------------- | ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `username`    | **да**      | 6–30 символов, `^[A-Za-z0-9!_-]+$`, уникален               | `username must match /^(?=.{6,30}$)[A-Za-z\d!_-]+$/ regular expression`  |
| `firstName`   | **да**      | 1–50, буквы (лат/кир), пробел, дефис, апостроф             | `Only letters, spaces, hyphens and apostrophes`                          |
| `lastName`    | **да**      | то же                                                      | то же                                                                    |
| `dateOfBirth` | нет         | ISO `YYYY-MM-DD`, не в будущем, **возраст ≥ 13**           | `dateOfBirth must be a valid ISO 8601 date string` / код `USER_UNDER_13` |
| `countryId`   | нет         | UUID страны, должен существовать                           | `countryId must be a UUID`                                               |
| `cityId`      | нет         | UUID города, должен существовать **и принадлежать** стране | `CITY_NOT_IN_COUNTRY` / `City not found`                                 |
| `aboutMe`     | нет         | 0–200 символов                                             | `aboutMe must be shorter than or equal to 200 characters`                |

Строки триммятся до валидации.

---

## 4. «Очистить» vs «не менять»

Для опциональных полей (`dateOfBirth`, `countryId`, `cityId`, `aboutMe`):

| Хотите             | Что слать                                |
| ------------------ | ---------------------------------------- |
| Не менять значение | поле **не передавать** (или `undefined`) |
| Очистить           | `field: null`                            |

> ⚠️ Различие делается на бэке по **наличию ключа** в input, а не по значению. Если шлёте
> `null` — значение стирается; если ключа нет — остаётся как было.

Локация:

- `countryId: null` → город **очищается автоматически** (`cityId` тоже станет `null`);
- смена страны **без** `cityId` → город тоже очищается (старый город может не принадлежать новой стране);
- `cityId` без `countryId` → валидация идёт против страны, которая уже сохранена у пользователя;
  если страны нет — ошибка `Country must be set together with city`.

Рекомендация: в форме **всегда отправляйте обе локации** (значение или `null`). Тогда ветка
«не менять» не нужна, а поведение полностью предсказуемо.

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

| Ситуация                                                  | HTTP ответа | `extensions.code`           | `statusCode` | `extensions.errors[]`                                                      |
| --------------------------------------------------------- | ----------- | --------------------------- | ------------ | -------------------------------------------------------------------------- |
| Успех                                                     | 200         | —                           | —            | —                                                                          |
| Нарушено правило поля (длина, regex, UUID, дата, >200)    | **200**     | `BAD_USER_INPUT`            | 400          | `[{ field, message }]`                                                     |
| Возраст < 13                                              | **200**     | `USER_UNDER_13`             | 400          | `[{ field: "dateOfBirth", … }]`                                            |
| `username` занят                                          | **200**     | `USERNAME_TAKEN`            | 409          | `[{ field: "username", … }]`                                               |
| Город из другой страны                                    | **200**     | `CITY_NOT_IN_COUNTRY`       | 400          | `[{ field: "cityId", … }]`                                                 |
| Город без страны                                          | **200**     | `BAD_USER_INPUT`            | 400          | `[{ field: "cityId", message: "Country must be set together with city" }]` |
| Город не найден                                           | **200**     | `BAD_USER_INPUT`            | 400          | `[{ field: "cityId", message: "City not found" }]`                         |
| Нет/просрочен токен                                       | **200**     | `UNAUTHENTICATED`           | 401          | `null`                                                                     |
| Не передан обязательный `firstName`/`lastName`/`username` | **400**     | `BAD_USER_INPUT`            | 400          | `null` (ошибка GraphQL-валидации запроса)                                  |
| Неизвестное поле в selection set (`bio` и т.п.)           | **400**     | `GRAPHQL_VALIDATION_FAILED` | 400          | `null`                                                                     |

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

Очистка локации (`countryId: null` → город тоже `null`):

```json
{
  "data": {
    "updateProfile": {
      "countryId": null,
      "cityId": null,
      "dateOfBirth": null,
      "aboutMe": null,
      "displayName": "Clear City"
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
- [ ] Локацию отправлять парой (`countryId` + `cityId`) либо `null`.
- [ ] Смена страны в UI → сбросить выбранный город и отправить новый `countryId` + `cityId`.
- [ ] Ветвиться по `extensions.code`, а не по HTTP-статусу и не по тексту `message`.
- [ ] Field-ошибки из `extensions.errors[]` вешать на конкретные инпуты по `field`.
- [ ] `USER_UNDER_13` → показать ссылку на Privacy Policy (требование ТЗ).
- [ ] `USERNAME_TAKEN` → подсветить поле `username`.
- [ ] После успеха — обновить кэш `me` из ответа мутации (без второго запроса).
- [ ] Не передавать `userId`/`ownerId`.

---

## 9. Что ещё не готово (не закладывайтесь)

| Возможность                                                                      | Статус                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------- |
| Загрузка/замена/удаление фото профиля (`setProfilePhoto` / `deleteProfilePhoto`) | в разработке (B-3/B-4)                              |
| Счётчики профиля (`publicationsCount`, `followersCount`, `followingCount`)       | следующая фича                                      |
| Подписки (`follow`/`unfollow`), `isFollowing`                                    | следующая фича                                      |
| Поле `bio` в API                                                                 | удаляется в open #31; в backend dev пока существует |

---

## 10. Известные нюансы бэкенда (для понимания, не для обхода)

1. `countryId`/`cityId` валидируются как UUID v4. Значения из наших справочников всегда v4.
2. Кэп `limit` у `cities`: 20 по умолчанию, максимум 50, минимум 1.
3. Мутация возвращает `Me`, то есть приватный read-model — email/isConfirmed тоже придут.
4. Ограничение «возраст ≥ 13» считается по **UTC-дате**: `dateOfBirth` в UTC-полуночи,
   сравнение тоже в UTC — в день рождения возраст уже «полный».
