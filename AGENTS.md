# Picboard Frontend Agent Guide

This file is the short entry point for coding agents. The full source of truth is `docs/style_guide_full.md`.

## Before changing code

1. Read `docs/style_guide_full.md` and relevant documentation from `docs/`.
2. For product-facing changes, check `docs/project-brief.md` and stay within scope.
3. Follow `docs/work-instructions.md` for workflow requirements.
4. Inspect existing code and patterns before introducing new solutions.
5. Prefer named exports, strict TypeScript, and no `React.FC`.
6. Use path aliases for cross-module imports. Prefer narrow module public APIs over broad barrels. Use relative imports for module-local files.
7. Verify that CSS custom properties resolve to theme tokens, local definitions, or safe fallbacks.
8. Do not add dependencies, unrelated refactors, or formatting-only changes unless required.
9. Do not run build, test, lint, typecheck, or Storybook build commands unless explicitly requested or necessary to diagnose a concrete issue.

If a question can be answered by inspecting the codebase or documentation, investigate it before asking the user.

## Code simplicity and maintainability

**Write the simplest correct implementation that solves the actual task.**

- Prefer clear, direct, idiomatic React and TypeScript.
- Follow existing project patterns before creating abstractions.
- Avoid unnecessary hooks, refs, state, wrappers, helpers, and type aliases.
- Do not add speculative features, fallbacks, or configuration.
- Do not introduce defensive checks without a realistic failure scenario.
- Avoid duplicated logic, unnecessary object transformations, and redundant state.
- Prefer explicit, readable control flow over clever or overly generic solutions.
- Keep public APIs minimal and module responsibilities clear.
- Avoid obvious comments, repetitive documentation, and boilerplate.
- Write focused tests for meaningful behavior, contracts, and regressions.
- Do not create redundant tests solely to increase coverage or test internal implementation details.
- Preserve required validation, error handling, concurrency safety, and type correctness.

**Before finishing, review the complete diff for unnecessary complexity.**

Ask yourself:

- Can this be implemented more directly?
- Does every new abstraction solve a real problem?
- Is any logic, check, type, or comment redundant?
- Does this change introduce more complexity than the task requires?
- Would this implementation be easy for another developer to understand and maintain?

Remove unnecessary complexity before reporting completion.

Never sacrifice correctness, readability, or required safety to reduce line count.

## Scope and architecture

- Follow the project's FSD architecture and documented layer ownership.
- Modify only files relevant to the task.
- Avoid unrelated cleanup and large rewrites.
- Do not create reusable abstractions for a single hypothetical use case.
- Do not change runtime behavior merely to hide failures in external services or test environments.
- Keep test mocks and fixtures out of production behavior.

## Documentation

When changing architecture or behavior:

- Update the relevant documentation in the same task.
- Keep documented implementation status aligned with actual code.
- Change planned/pending to implemented/done only when functionality is actually complete.
- Avoid duplicating explanations already present in existing documentation.

## Code review

- Validate findings against project documentation and actual code.
- Reference the relevant architectural rule when reporting violations.
- Distinguish confirmed defects from subjective recommendations.
- Do not invent issues or propose refactoring without a concrete benefit.
- Run verification only when explicitly requested or when a concrete risk requires it.
- For failed checks, report the exact command, root cause, and whether the issue is a regression, flaky test, or environment failure.

## Final response

Keep the summary concise and factual:

1. What changed.
2. What was verified.
3. Remaining risks or limitations.
4. Relevant documentation.
5. Any recommendations, clearly separated from requirements.

Do not inflate the report with repetitive explanations or unsupported claims.

## Design reference

[Figma — Picboard](https://www.figma.com/design/vEOVR2cLJ7mgszs8mWuw8f/Inctagram--Copy-?node-id=301-4851&m=dev)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
