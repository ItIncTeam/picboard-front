# Picboard Frontend Agent Guide

Use this file as the short entry point. The full source of truth is
`docs/style_guide_full.md`.

Before changing code:

1. Read `docs/style_guide_full.md` and the relevant document from `docs/`.
2. For product-facing changes, check `docs/project-brief.md` and stay within scope.
3. For workflow expectations, follow `docs/work-instructions.md`.
4. Keep changes small, local, and consistent with the existing module.
5. Prefer named exports, strict TypeScript, and no `React.FC`.
6. Use path aliases for cross-module imports. Prefer the narrow public API for the target module
   (for example `@/features/auth/sign-up-form`) over broad barrels such as `@/features/auth`
   when a broad import pulls unrelated modules. Keep relative imports only for same-folder or
   module-local files such as CSS modules and index re-exports.
7. Verify CSS custom properties before finishing. Every `var(--...)` reference must resolve to a
   theme token, a local custom property, or a safe fallback. For library runtime variables
   (Radix, etc.), define local fallback values when IDE or lint tooling cannot resolve them.
8. Do not add dependencies, refactors, or formatting-only changes unless the task needs them.
9. Do not run build, test, lint, typecheck, or Storybook build commands during implementation unless explicitly requested or required to diagnose an issue.
10. In the final summary:

- state what changed;
- state what was checked;
- state any remaining risk;
- reference the relevant docs used for the implementation or review;
- clearly distinguish documented requirements from personal recommendations.

  Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

When reviewing code:

- validate findings against docs first;
- do not report architecture violations without referencing the relevant document;
- mark subjective suggestions as recommendations;
- run verification commands only if explicitly requested or if source review reveals a concrete risk;
- when a verification command fails, include the exact failing command, root cause, and whether the failure is a real regression, flaky test, or environment issue.

When updating architecture or behavior:

- update the relevant docs in the same task;
- keep implementation status in docs synchronized with the actual code;
- if implementation changes make a documented "planned" feature complete, update the documentation from pending/planned to implemented/done.
Figma https://www.figma.com/design/vEOVR2cLJ7mgszs8mWuw8f/Inctagram--Copy-?node-id=301-4851&m=dev
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
