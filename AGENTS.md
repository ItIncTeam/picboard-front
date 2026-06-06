# Picboard Frontend Agent Guide

Use this file as the short entry point. The full source of truth is
`docs/style_guide_full.md`.

Before changing code:

1. Read `docs/style_guide_full.md` and the relevant document from `docs/`.
2. For product-facing changes, check `docs/project-brief.md` and stay within scope.
3. For workflow expectations, follow `docs/work-instructions.md`.
4. Keep changes small, local, and consistent with the existing module.
5. Prefer named exports, strict TypeScript, and no `React.FC`.
6. Do not add dependencies, refactors, or formatting-only changes unless the task needs them.
7. After changes, run the relevant check. Before PR, default to `pnpm check`.
8. In the final summary:
   - state what changed;
   - state what was checked;
   - state any remaining risk;
   - reference the relevant docs used for the implementation or review;
   - clearly distinguish documented requirements from personal recommendations.

When reviewing code:

- validate findings against docs first;
- do not report architecture violations without referencing the relevant document;
- mark subjective suggestions as recommendations.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
