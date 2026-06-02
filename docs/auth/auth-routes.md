Ничего не изменял. В текущем docs/ на диске нет auth-sprint-plan.md и session-
architecture.md; вместо этого есть новый docs/auth-roadmap.md. git status
показывает A docs/auth-roadmap.md, то есть это уже незакоммиченный новый файл.
План ниже учитывает целевую задачу PR и текущее состояние.

Текущие Источники

Current File Status Role  
 ━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docs/auth- exists, new Фактически содержит бывший
roadmap.md auth-sprint-plan.md:
infrastructure plan + backend
status + session mentions.
────────────────── ──────────────────────── ────────────────────────────────
docs/session- absent in current tree Нужно восстановить/создать как
architecture.md docs/auth/auth-session-
architecture.md.
────────────────── ──────────────────────── ────────────────────────────────
docs/app-router- exists Source of truth по routes/
roadmap.md layouts, содержит /auth
routes.
────────────────── ──────────────────────── ────────────────────────────────
docs/project- exists Onboarding, содержит auth UI
start-guide.md placement.
────────────────── ──────────────────────── ────────────────────────────────
docs/ exists Docs index, нужно обновить
style_guide_full ссылки.
.md
────────────────── ──────────────────────── ────────────────────────────────
docs/routing- exists Архивный routing doc, удалить.
plan.md
────────────────── ──────────────────────── ────────────────────────────────
docs/fsd- exists Короткий дубль
structure.md architecture.md/layer-
ownership.md, пометить
deprecated или удалить после
merge.

PR Цель

docs: reorganize auth documentation

Только документация. Без изменений src, package files, configs.

———

1. Новая Папка

Создать:

docs/auth/

Назначение: все auth/session/backend contract docs держать отдельно от общих
engineering docs.

———

2. Перенос И Переименование

From To Notes  
 ━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docs/auth- docs/auth/auth- В текущем дереве реальный source —
sprint-plan.md infrastructure- auth-roadmap.md, но в PR можно
или текущий plan.md оформить как rename из актуального
docs/auth- файла.
roadmap.md
────────────────── ────────────────── ──────────────────────────────────────
docs/session- docs/auth/auth- Сейчас файла нет в tree; если он
architecture.md session- есть в base branch, переносить. Если
architecture.md нет, создать новый по утвержденной
session architecture.

Важно: если в ветке уже нет auth-sprint-plan.md, не пытаться “переносить”
несуществующий файл. Использовать текущий auth-roadmap.md как источник и
удалить его после создания docs/auth/auth-infrastructure-plan.md.

———

3. Новые Документы

docs/auth/auth-backend-contract.md

Содержимое:

Backend GraphQL Auth Contract
Queries
Mutations
Inputs
Payloads
Available operations
Missing operations
Questions for backend
Schema source / introspection status

Должен зафиксировать:

Query:
me
user

Mutation:
signUp
signIn
emailConfirmation

Missing:
forgotPassword
createNewPassword / passwordRecovery
logout
refreshToken

И отдельно отметить, что текущий introspection JSON ранее был неполным, если
это все еще актуально.

docs/auth/auth-routes.md

Содержимое:

Route
App page file
View
Feature
GraphQL operation
Status
Notes

Покрыть:

/auth/sign-in
/auth/sign-up
/auth/forgot-password
/auth/create-new-password
/auth/confirm/registration
/auth/confirm/password-recovery

Для каждого route указать:

View exists / missing
Feature planned / existing
GraphQL operation available / missing
PublicAuthShell coverage

———

4. Обновить Ссылки

Изменить:

docs/style_guide_full.md

Добавить ссылки:

[Auth Infrastructure](./auth/auth-infrastructure-plan.md)
[Auth Session Architecture](./auth/auth-session-architecture.md)
[Auth Backend Contract](./auth/auth-backend-contract.md)
[Auth Routes](./auth/auth-routes.md)

Также убрать/проверить битую ссылку:

figma-workflow.md

Сейчас style_guide_full.md ссылается на docs/figma-workflow.md, которого нет в
текущем docs.

Изменить:

docs/project-start-guide.md

В разделе “Где писать auth UI” добавить ссылки на:

docs/auth/auth-routes.md
docs/auth/auth-infrastructure-plan.md
docs/auth/auth-session-architecture.md

Изменить при необходимости:

docs/app-router-roadmap.md

В разделе public auth routes добавить reference:

Подробная auth route map: ./auth/auth-routes.md

Изменить при необходимости:

docs/architecture.md
docs/layer-ownership.md

Только если есть прямые auth/session details, которые лучше вынести ссылкой.
Не дублировать auth flow внутри общих FSD docs.

———

5. Удалить Или Deprecated

Удалить:

docs/routing-plan.md

Причина: файл сам помечен архивным и указывает на app-router-roadmap.md.

Для docs/fsd-structure.md выбрать один вариант:

Рекомендуемый вариант для безопасного PR:

docs/fsd-structure.md

Оставить, но пометить deprecated:

Deprecated. Use architecture.md and layer-ownership.md.

Удаление лучше делать отдельным cleanup PR или после merge, потому что файл
может использоваться внешними ссылками.

———

6. Актуализация Auth Docs

docs/auth/auth-infrastructure-plan.md

Структура:

# Auth Infrastructure Plan

## Goal

## Current Frontend State

## Target FSD Structure

## PR Breakdown

## Apollo Infrastructure

## Auth Features

## Entities

## Views

## App Layouts

## GraphQL Operations

## Missing Backend Operations

## Out Of Scope

Актуализировать:

accessToken only memory
refreshToken backend httpOnly cookie
Apollo Provider already planned in app/layout.tsx
Root layout remains Server Component
auth forms are separate feature PRs
refresh/logout not available yet

Убрать противоречие:

session: accessToken, refreshToken

Заменить на:

session: accessToken in memory, status, user
refreshToken: backend-only HttpOnly Cookie, not stored in frontend

docs/auth/auth-session-architecture.md

Структура:

# Auth Session Architecture

## Principles

## Token Strategy

## Sign In Flow

## Authorized GraphQL Requests

## F5 Bootstrap

## Refresh Flow

## Logout Flow

## Apollo Integration

## Storage Rules

## Risks While Backend Refresh/Logout Missing

Зафиксировать:

accessToken: memory only
refreshToken: HttpOnly Cookie managed by backend
no localStorage
no sessionStorage
no frontend-readable cookies
authLink adds Authorization
errorLink clears accessToken on 401/403, no refresh retry until backend exists

———

7. Файлы PR

File Action Description  
 ━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docs/auth/ create Новая папка для auth docs.
────────────────── ─────────────────────────── ─────────────────────────────
docs/auth/auth- create/rename План auth infrastructure,
infrastructure- PR roadmap, FSD placement.
plan.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/auth/auth- create/rename Token/session source of
session- truth.
architecture.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/auth/auth- create Backend GraphQL contract
backend- for auth.
contract.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/auth/auth- create Route → View → Feature →
routes.md Operation map.
────────────────── ─────────────────────────── ─────────────────────────────
docs/auth- delete after migration Старый auth doc больше не
roadmap.md нужен в root.
────────────────── ─────────────────────────── ─────────────────────────────
docs/auth- delete if exists in base Старое имя заменить новым.
sprint-plan.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/session- delete if exists in base Старое имя заменить новым.
architecture.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/ update Docs index + auth links +
style_guide_full fix missing figma link if
.md needed.
────────────────── ─────────────────────────── ─────────────────────────────
docs/project- update Add auth docs references.
start-guide.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/app-router- update Link to auth route map.
roadmap.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/routing- delete Архивный routing doc.
plan.md
────────────────── ─────────────────────────── ─────────────────────────────
docs/fsd- deprecate or delete later Prefer deprecated marker in
structure.md this PR.

———

Итоговая docs/auth/

docs/auth/
auth-infrastructure-plan.md
auth-session-architecture.md
auth-backend-contract.md
auth-routes.md

Удалено

docs/routing-plan.md
docs/auth-roadmap.md

Если существуют в base branch:

docs/auth-sprint-plan.md
docs/session-architecture.md

Deprecated

docs/fsd-structure.md

Пометка:

Deprecated. Use docs/architecture.md and docs/layer-ownership.md.

Итоговый Scope PR

docs: reorganize auth documentation

Входит:

создание docs/auth
перенос auth/session docs в docs/auth
новые auth backend/routes docs
обновление ссылок из root docs
удаление routing-plan.md
deprecated marker для fsd-structure.md
актуализация accessToken/refreshToken architecture
актуализация missing backend operations

Не входит:

изменения src
изменения package/lock/config
реализация Apollo/session/auth features
codegen
GraphQL operations files

Рекомендация: делать этот PR после текущего Apollo infrastructure PR или очень
аккуратно ребейзить, потому что docs/auth-roadmap.md уже находится в
незакоммиченном состоянии.
