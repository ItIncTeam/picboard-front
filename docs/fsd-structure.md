# FSD: кратко

Основные правила слоев описаны здесь:

- [Architecture](./architecture.md)
- [Границы слоев](./layer-ownership.md)

Короткая схема:

```txt
app -> views -> widgets -> features -> entities -> shared
```

`app/` — маршруты и layouts.

`views/` — сборка страниц.

`widgets/` — крупные UI-блоки и shells.

`features/` — действия пользователя.

`entities/` — бизнес-сущности.

`shared/ui` — только UI primitives.

Если сомневаетесь, сначала проверьте `views/`, `widgets/`, `features/` и `shared/ui`, чтобы не
создать дубликат.
