# Create Post Figma Review

Этот документ фиксирует review макетов Create Post flow из Figma и переводит визуальные состояния в
frontend architecture decisions. Он не заменяет [Create Post Flow](./04-create-post-flow.md), а
уточняет UI, sequencing и риски реализации.

## Reviewed nodes

Figma file: `Inctagram--Copy-`

- `306:5953` - Cropping step, default state.
- `306:6103` - Cropping step with image carousel arrows.
- `306:6253` - Cropping step with aspect ratio menu.
- `306:6403` - Cropping step with `16:9` selected.
- `306:6540` - Filters step.
- `306:6848` - Overlay state only.
- `306:6972` - Close confirmation dialog over Create Post modal.

## High-level reading

The designs describe a route modal workflow, not a standalone page-first experience:

- the protected main layout remains visible behind the overlay;
- sidebar and header stay mounted;
- the create flow is centered over the existing `(main)` segment;
- the URL should remain `/posts/create`;
- direct open/reload still needs a fallback page because previous route context is unavailable.

This matches the team decision to use the existing App Router `@modal` slot.

## Visual states

### Cropping default

The default crop state uses a compact modal:

- approximate modal size: `492x564`;
- header height: about `60px`;
- title: `Cropping`;
- back control on the left;
- `Next` action on the right;
- image preview fills the body edge-to-edge;
- bottom floating controls include aspect ratio, zoom and media strip toggles.

Implementation implication:

- `app/` should only route to the shell;
- modal shell should allow edge-to-edge body content;
- crop UI should live in `features/create-post`;
- image tools should be local to the feature, not generic shared UI until reuse is proven.

### Cropping carousel

The carousel state adds previous/next image controls over the image preview and keeps a bottom media
strip.

Implementation implication:

- active image should be part of create flow state;
- carousel controls should update `activeImageId` and use bounded navigation without wrapping from
  the last image to the first or from the first image to the last;
- media order must be preserved in state;
- `embla-carousel-react` should be added only in a dedicated dependency PR, after the static
  structure is in place.

### Aspect ratio menu

The aspect ratio menu is a floating panel over the image area. Options shown in Figma:

- `Оригинал`;
- `1:1`;
- `4:5`;
- `16:9`.

Implementation implication:

- aspect ratio is per image, not global;
- selected ratio must be persisted when the user switches images;
- the menu is local crop-step UI state;
- cropper coordinates should use the exact `react-advanced-cropper` types once the dependency is
  installed.

### Filters

The filters state uses a wider modal:

- approximate modal size: `972x564`;
- preview remains on the left;
- filter grid is on the right;
- visible labels include `Normal`, `Clarendon`, `Lark`, `Gingham`, `Moon`.

Implementation implication:

- the modal shell must support step-dependent width;
- filter preview and selected preset are per image;
- CSS filters are acceptable for preview, but export must apply the same visual result to the final
  canvas/blob before backend upload;
- exact Instagram-like filter parity is a product/design decision, not an implicit requirement.

### Overlay

Node `306:6848` is only the dark overlay state. It is not a separate route or feature.

Implementation implication:

- overlay should remain owned by the modal/dialog layer;
- do not create an application route or feature component for this node.

### Close confirmation

The confirmation design shows a nested dialog over the create modal:

- title: `Close`;
- explanatory text warns that publication creation will be deleted;
- actions in Figma: `Discard` and `Save draft`.

Team decision overrides the Figma action set:

- draft is postponed to the end of the sprint;
- `Save draft` must not be implemented in the current flow;
- close confirmation appears only when `hasUnsavedData === true`;
- until draft exists, the safe action set is `Discard` and `Keep editing`.

Implementation implication:

- do not add draft persistence or draft UI in early PRs;
- do not show a disabled `Save draft` button unless product explicitly asks for it;
- confirmation can be a nested local dialog later, but only after unsaved data tracking exists.

## Design tokens

The Figma palette maps well to existing project tokens:

- `#000000` -> `--color-dark-900`;
- `#0d0d0d` -> `--color-dark-700`;
- `#171717` -> `--color-dark-500`;
- `#333333` -> `--color-dark-300`;
- `#4c4c4c` -> `--color-dark-100`;
- `#ffffff` -> `--color-light-100`;
- `#8d9094` -> `--color-light-900`;
- `#397df6` -> `--color-primary-500`;
- `#cc1439` -> `--color-danger-500`.

Use existing CSS custom properties instead of hard-coded Figma colors where possible.

## Typography

The designs use Inter with these repeated text styles:

- modal title: `20px / 36px`, bold;
- step/action text: `16px / 24px`, semi-bold or regular;
- filter labels and secondary controls: `14px / 24px`, regular or medium.

Implementation implication:

- reuse existing typography primitives/classes if they match;
- otherwise keep typography local to create-post CSS modules;
- do not introduce Tailwind or a new typography system for this flow.

## Icons and assets

The designs include controls for:

- back;
- close;
- aspect ratio;
- zoom;
- media gallery;
- previous/next;
- add image;
- remove image.

Project direction:

- prefer existing assets or current icon strategy;
- do not add a new icon dependency in this sprint task;
- add missing icons as local SVG assets/components only when implementation reaches that control;
- keep icon buttons accessible with `aria-label`.

Zoom is not implemented yet. Its control and reducer behavior remain a product follow-up until zoom
step, range and reset semantics are confirmed; do not render a non-functional Figma control.

## FSD placement

Recommended placement:

```txt
app/(protected)/(main)/@modal/(.)posts/create/page.tsx
  Thin route adapter.

app/(protected)/(main)/posts/create/page.tsx
  Thin fallback route adapter.

widgets/create-post-modal
  Route modal shell, close behavior, step-dependent modal sizing.

views/create-post-page
  Direct-open fallback page shell.

features/create-post
  CreatePostFlow, step state, upload, crop, filters, publication, object URL lifecycle, export.

entities/post
  Frontend display skeleton first; Post model/API only after backend integration starts.
```

Do not put cropper state, file state, filter logic or publication form logic in `app/`, `views/` or
`widgets/create-post-modal`.

State ownership:

- Dev 1 owns `CreatePostState`, `CreatePostImage` and `CreatePostStep`.
- Dev 2 and Dev 3 should build upload/crop/filter UI against that contract.
- Any shared state shape change needs agreement with Dev 1 before implementation.

## Recommended implementation order

1. Convert the current skeleton into a real `CreatePostFlow` shell with static step layout.
2. Match the modal header, back/next controls and desktop dimensions from Figma.
3. Add upload selection and object URL lifecycle.
4. Add crop step with `react-advanced-cropper`.
5. Add aspect ratio menu and zoom controls.
6. Add multi-image media strip and carousel behavior.
7. Add filters grid and preview.
8. Add final edited `File` export.
9. Add publication step and publish boundary.
10. Add `initiateUploadBatch`, direct storage `PUT`, `completeUpload` and `createPost`
    integration in a dedicated backend integration PR.
11. Add draft persistence only at the end of the sprint if the team finalizes the behavior.

## Architecture risks

- Implementing Figma-generated code directly would bypass project CSS modules, tokens and FSD
  boundaries.
- Reusing the generic shared `Modal` for the final design may be too restrictive because the flow
  needs edge-to-edge media body and step-dependent width.
- Adding `Save draft` before persistence exists would create a false product promise.
- Treating filters as CSS-only preview without export parity would make published images differ from
  what the user saw.
- Putting upload/crop/filter state into the modal shell would make fallback page reuse harder.
- Adding GraphQL operations outside the dedicated backend integration PR would mix documentation,
  schema and Apollo work.
- Using GraphQL Upload would contradict the backend-confirmed direct storage upload architecture.

## Open product questions

- Should mobile render as a full-screen create flow instead of a desktop-sized centered modal?
- Should the UI language be English, Russian, or current app locale? Figma currently mixes strings.
- Which filter presets are required for MVP, and do they need exact Instagram-style parity?
- Should users be allowed to reorder images in MVP?
- After successful publish, should the user stay on the current page, go to profile, or open the new
  post details route?
- Should the fallback `/posts/create` page look like a full page wizard or keep the same modal-sized
  card centered in page content?

## Team recommendations

- Keep the first implementation PR visual but non-functional: modal shell, header, static steps and
  no dependencies.
- Keep the first Posts Consumption PR limited to `entities/post`, `PostCard`, `PostGrid` and
  `PostDetails`.
- Split dependency installation into separate PRs with clear usage immediately following.
- Treat Dev 1 as Create Flow Owner for `CreatePostState`, `CreatePostImage` and `CreatePostStep`
  to avoid upload/crop/filter PRs inventing incompatible local models.
- Dev 2/3 should not change the shared state shape without Dev 1 approval.
- Review Figma text before implementation and do not copy mixed-language strings blindly.
- Move edit/delete, Main Page and infinite scroll into follow-up PRs.
