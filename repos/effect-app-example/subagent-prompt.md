study specs/todos.md, specs/readme, specs/progress.txt to understand what needs to be done next.

Pick the most important point and implement it

reference repos/effect for the effect codebase instead of docs or node_modules

Key migration patterns:

- `Effect.Service<Self>()(id, { effect, dependencies })` → `ServiceMap.Service<Self>()(id, { make })` + explicit `.layer`
- `Context.Tag` → `ServiceMap.Service`
- `Context.Reference` → `ServiceMap.Reference`
- `Schema.compose` → `Schema.decodeTo`
- `Schema.TaggedError` → `Schema.TaggedErrorClass`
- Layer references: `.Default` → `.layer` where applicable
- Import `@effect/platform` → `effect/unstable/http` or `effect/unstable/httpapi`
- Import `@effect/sql` → `effect/unstable/sql`

After completing the migrations:

1. Update specs/todos.md to mark the completed items with [x]
2. Append to specs/progress.txt documenting what changes were made to each file
3. Create a git commit with a descriptive message summarizing the changes
