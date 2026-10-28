# Редактирование профиля — контракт для фронтенда

Документ описывает **уже реализованный** бэкенд: мутацию `updateProfile` и read-model профиля,
который она возвращает. Всё ниже проверено на живом инстансе users-subgraph (локальный Postgres,
справочник 250 стран / 34 160 городов) с включёнными прод-пайпами валидации.

**Статус:** `updateProfile` работает, покрыта тестами (21 unit + 6 e2e).
**Вне этого документа:** загрузка/удаление фото профиля (в разработке), счётчики профиля
и подписки (следующая фича).

Смежные документы: `md-files/local-db-country-city-guide-ru.md` (стенд),
`agent/frontend-api-spec.md` (общий спек API).

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

| Возможность                                                                      | Статус                                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Загрузка/замена/удаление фото профиля (`setProfilePhoto` / `deleteProfilePhoto`) | в разработке (B-3/B-4)                                                                    |
| Счётчики профиля (`publicationsCount`, `followersCount`, `followingCount`)       | следующая фича                                                                            |
| Подписки (`follow`/`unfollow`), `isFollowing`                                    | следующая фича                                                                            |
| Поле `bio` в API                                                                 | **удалено**, используйте `aboutMe` (в БД колонка называется `bio`, это внутренняя деталь) |

---

## 10. Известные нюансы бэкенда (для понимания, не для обхода)

1. `countryId`/`cityId` валидируются как UUID v4. Значения из наших справочников всегда v4.
2. Кэп `limit` у `cities`: 20 по умолчанию, максимум 50, минимум 1.
3. Мутация возвращает `Me`, то есть приватный read-model — email/isConfirmed тоже придут.
4. Ограничение «возраст ≥ 13» считается по **UTC-дате**: `dateOfBirth` в UTC-полуночи,
   сравнение тоже в UTC — в день рождения возраст уже «полный».
