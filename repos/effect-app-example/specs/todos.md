# Effect v3 to v4 Migration Plan

## Package Dependencies

- [x] Update `@effect/platform-node` to `4.0.0-beta.38`
- [x] Update `@effect/sql-sqlite-node` to `4.0.0-beta.38`
- [x] Update `@effect/opentelemetry` to `4.0.0-beta.38`
- [x] Update `@effect/vitest` to `4.0.0-beta.38`
- [x] Remove `@effect/platform` (consolidated into `effect`)
- [x] Remove `@effect/sql` (consolidated into `effect`)
- [x] Remove `@effect/experimental` (consolidated into `effect`)

## Domain Layer

- [x] `src/Domain/User.ts` - `Context.Tag` → `ServiceMap.Service` for `CurrentUser`
- [x] `src/Domain/User.ts` - `Schema.compose` → `Schema.decodeTo` for `UserIdFromString`
- [x] `src/Domain/User.ts` - `Schema.TaggedError` → `Schema.TaggedErrorClass` for `UserNotFound`
- [x] `src/Domain/Policy.ts` - `Schema.TaggedError` → `Schema.TaggedErrorClass` for `Unauthorized`
- [x] `src/Domain/Account.ts` - no changes needed (already v4 compatible)
- [x] `src/Domain/Group.ts` - `Schema.compose` → `Schema.decodeTo`, `Schema.TaggedError` → `Schema.TaggedErrorClass`
- [x] `src/Domain/Person.ts` - `Schema.compose` → `Schema.decodeTo`, `Schema.TaggedError` → `Schema.TaggedErrorClass`
- [x] `src/Domain/Email.ts` - `Schema.pattern` → `Schema.check(Schema.isPattern())`
- [x] `src/Domain/AccessToken.ts` - no changes needed (already v4 compatible)

## Repository Layer

- [x] `src/Accounts/AccountsRepo.ts` - `Effect.Service` → `ServiceMap.Service` with `make`, remove `dependencies`, add explicit `.layer`
- [x] `src/Accounts/UsersRepo.ts` - `Effect.Service` → `ServiceMap.Service` with `make`, remove `dependencies`, add explicit `.layer`
- [x] `src/Groups/Repo.ts` - `Effect.Service` → `ServiceMap.Service` with `make`, remove `dependencies`, add explicit `.layer`
- [x] `src/People/Repo.ts` - `Effect.Service` → `ServiceMap.Service` with `make`, remove `dependencies`, add explicit `.layer`

## Service Layer

- [x] `src/Accounts.ts` - `Effect.Service` → `ServiceMap.Service` with `make`
- [x] `src/Groups.ts` - `Effect.Service` → `ServiceMap.Service` with `make`
- [x] `src/People.ts` - `Effect.Service` → `ServiceMap.Service` with `make`
- [x] `src/Accounts/Policy.ts` - `Effect.Service` → `ServiceMap.Service` with `make`

## HTTP Layer

- [x] `src/Accounts/Http.ts` - update layer references `.Default` → `.layer`
- [x] `src/Groups/Http.ts` - update layer references `.Default` → `.layer`
- [x] `src/People/Http.ts` - update layer references `.Default` → `.layer`

## Infrastructure

- [x] `src/Http.ts` - update any layer references
- [x] `src/Sql.ts` - check for service patterns
- [x] `src/Tracing.ts` - check for service patterns
- [x] `src/main.ts` - update layer references
- [x] `src/lib/Layer.ts` - update test layer helper if needed

## Tests

- [x] `test/**/*.ts` - update all test files with new patterns

## Verification

- [x] Run `pnpm check` to verify TypeScript compilation - **COMPLETED: 0 errors**
- [ ] Run `pnpm test` to verify tests pass - **READY TO RUN**

## Additional Migration Required

The following v4 API changes were discovered during verification that need to be addressed:

### SQL Model API Changes
- [x] Update Model.Class usage - remove .insert, .jsonCreate, .jsonUpdate properties
- [x] Find v4 equivalent for model insert/update schemas - use Model.insert.makeUnsafe() and Model.update.makeUnsafe()
- [x] Update all repository insert/update calls to use new API
- [x] Migrate repositories to use SqlSchema.findOneOption for findById (returns Option<T>)
- [x] Affected: Domain models (User, Account, Group, Person) and all repositories

### HttpApi Changes
- [x] Fix HttpApiMiddleware.Tag usage in src/Accounts/Api.ts - removed middleware pattern, using manual auth
- [x] Replace .setPath() with v4 equivalent for HttpApiEndpoint - use params option in constructor
- [x] Replace .addSuccess() with .success for HttpApiEndpoint - use success option in constructor
- [x] Remove .middlewareEndpoints() calls or find v4 equivalent - removed, using manual provideCurrentUser
- [x] Replace .json property on Model classes for JSON schema generation - Model.json still works as static property
- [x] Find v4 equivalent for Schema.partialWith() - created makePartialExact helper function
- [x] Affected: src/Accounts/Api.ts, src/Groups/Api.ts, src/People/Api.ts

### Service & Layer API Changes
- [x] Remove .Default references from ServiceMap.Service classes - using .layer instead
- [x] Remove .DefaultWithoutDependencies references
- [x] Fix Layer.provide() calls to use single layer argument (use Layer.provideMerge for multiple) - updated throughout
- [x] Fix Uuid service - should use ServiceMap.Service pattern - migrated to use make with Effect.sync
- [x] Affected: All service classes (Accounts, Groups, People, Repos, Uuid)

### Authentication Service
- [x] Reimplement Authentication service pattern for v4 - using provideCurrentUser helper with HttpServerRequest cookies
- [x] Affected: src/Accounts/Http.ts, src/Groups/Http.ts, src/People/Http.ts

### Runtime & Main Entry Point
- [x] Fix main.ts to use v4 Layer.launch and NodeRuntime.runMain pattern
- [x] Provide SqlLive to HttpLive to resolve dependencies
- [x] Fix remaining 'any' context in main.ts - used type assertion with Effect.scoped and Layer.build

### Schema & Type Issues
- [x] Fix SchemaError and SqlError appearing in HTTP handler types
  - Fixed by adding Effect.catchTag("SchemaError") and Effect.orDie to service methods
  - Updated Accounts.updateUser to catch SchemaError
  - Updated Accounts.embellishUser to use Effect.orDie
  - Updated Groups.create and Groups.update to use Effect.orDie
  - Updated People.create to use Effect.orDie
  - Fixed provideCurrentUser to use Effect.orDie for infrastructure errors
- [x] Fix main.ts 'any' context issue
  - Used Effect.scoped with Layer.build and type assertion
  - Added Effect.orDie to convert initialization errors to defects
- [x] Verify Option.match patterns work correctly in v4 - working correctly

## Quick Reference

| v3 | v4 |
|---|---|
| `Context.Tag(id)<Self, Shape>()` | `ServiceMap.Service<Self, Shape>()(id)` |
| `Effect.Service<Self>()(id, { effect, dependencies })` | `ServiceMap.Service<Self>()(id, { make })` + explicit `.layer` |
| `Schema.compose(schema)` | `Schema.decodeTo(schema)` |
| `Schema.TaggedError` | `Schema.TaggedErrorClass` |
| `*.Default` layer | `*.layer` |
| `Context.Reference` | `ServiceMap.Reference` |
