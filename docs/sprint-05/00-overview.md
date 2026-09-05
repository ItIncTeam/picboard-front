# Sprint 05 Overview

Этот документ фиксирует верхнеуровневый scope Sprint 05. Подробные подтвержденные решения находятся
в [Decision Log](./01-decisions.md), а разрешенные work streams — в
[Frontend Task Breakdown](./02-frontend-task-breakdown.md).

Инженерные правила остаются в [Style Guide](../style_guide_full.md),
[Architecture](../architecture.md), [Layer Ownership](../layer-ownership.md) и
[App Router Roadmap](../app-router-roadmap.md).

## Sprint status

**ARCHITECTURE AUDIT PAUSED / IN PROGRESS**

Production implementation не начата. До завершения общего аудита task breakdown остается
предварительной декомпозицией подтвержденного scope, а не финальным implementation plan.

Checkpoint: подтверждены Decisions 1–32. Production code/schema не менялись, commit/push не
выполнялись.

## Goal

Подготовить и реализовать Edit Profile, Avatar, Public User Profile SSR, User Posts и Public Post
SSR без временных backend contracts и без нарушения существующих App Router, Apollo и FSD-границ.

## Confirmed scope

### Public Profile and User Posts

- Public `/profile/[userId]` с dynamic SSR per request.
- Atomic initial payload: public user, public counters и первая cursor-page `profilePosts`.
- Initial public data присутствует в HTML и после hydration seed-ится в существующий Apollo cache.
- Локальная cursor pagination, `fetchMore`, first-page polling и reconciliation сохраняются.
- `/me` остается client-only и не участвует в anonymous SSR.

### Public Post

- Canonical public route: `/posts/[postId]`.
- Direct request рендерит standalone SSR page.
- Soft navigation из Main/Profile использует intercepted route в существующем `@modal` slot.
- SSR presentation ограничена доступным backend payload: author, attachments/media, description и
  `createdAt`.
- Существующие owner/viewer-dependent controls используются только там, где их поддерживает live
  contract.

### Edit Profile and Avatar

Обе области имеют статус **IN SPRINT / BACKEND-BLOCKED**.

До backend contract разрешены UI, RHF state, client validation, DOB/calendar UX, age validation,
Privacy Policy flow, contract-independent avatar UI и focused component tests. Production route
`/settings/profile` остается placeholder до подтверждения read/update contract.

## Backend-blocked scope

- Profile fields and nullability: `firstName`, `lastName`, `dateOfBirth`, `country`, `city` и другие
  фактические edit fields.
- Read/update Profile operations и backend validation/error mapping.
- Avatar upload purpose, attach/replace/delete mutations и display avatar URL.
- Public `publicationsCount`, `followersCount` и `followingCount`.
- Точный backend signal для missing user/post: nullable result или typed GraphQL error.
- Подтверждение author shape и `updatedAt` semantics в live schema.

Временные GraphQL documents, mock mutations, временные User fields и fake production data
запрещены. После появления backend contract обязательна повторная live introspection.

## Product-decision-gated scope

- Followers list/modal.
- Following list/modal.
- Follow.
- Unfollow.

Эти возможности одновременно backend-blocked и не входят в implementation без отдельного product
confirmation.

## Follow-up scope

- Delete follower.
- Send Message, если отдельно не подтвержден в Sprint 05.
- Comments, replies, likes, engagement counters и соответствующие viewer actions Public Post.

Элементы могут быть видимы в Figma, но Figma completeness не означает backend или Sprint 05
completeness.

## High-level dependencies

1. Завершить общий architecture/scope audit.
2. Провести отдельный live backend-contract audit.
3. Подготовить один конкретный backend work package для отсутствующих contracts.
4. Продолжать contract-independent Edit Profile/Avatar UI параллельно с backend work.
5. После подтверждения contract выполнить integration planning и только затем заменить production
   placeholders или подключить backend-dependent UI.

## Resume point

Общий architecture/scope audit остановлен после подтверждения effect-based Apollo
`seededBaselineKey` lifecycle (Decision 32).

Следующая ветка: route-local error/Retry и loading/streaming semantics atomic Public Profile SSR.
Полная очередь находится в [Open decisions / audit queue](./01-decisions.md#open-decisions--audit-queue).
После закрытия этой очереди запускается отдельный live backend-contract audit; он не является
частью текущего checkpoint.

### Instructions for the next Codex session

1. Прочитать `AGENTS.md`, `docs/style_guide_full.md` и три Sprint 05 документа.
2. Не менять production code/schema и не выполнять commit/push во время продолжения аудита.
3. Продолжить с первого пункта Open decisions; задавать по одному вопросу с recommended answer.
4. Сначала исследовать codebase, local Next.js 16.2.4 docs и concrete Figma frames, если вопрос
   можно сузить без product input.
5. После каждого confirmation синхронизировать Decision Log и Task Breakdown.
6. Не начинать backend-contract audit, пока general audit queue не закрыта отдельным подтверждением.
