# Project Specifications

TypeScript Effect-based HTTP API server for reservations and group management.

## Index

| # | File | Summary |
|---|------|---------|
| 01 | [project-overview](./01-project-overview.md) | Tech stack (Effect, SQLite, OpenTelemetry), directory structure, ESLint/dprint formatting rules |
| 02 | [effect-patterns](./02-effect-patterns.md) | ServiceMap.Service definition, Effect.gen generators, pipe composition, Layer dependency injection |
| 03 | [domain-models](./03-domain-models.md) | Branded types with Schema, Model.Class entities, field annotations, Redacted sensitive data |
| 04 | [error-handling](./04-error-handling.md) | TaggedErrorClass definitions, Option.match handling, catchTag recovery, orDie for defects |
| 05 | [http-api](./05-http-api.md) | HttpApiGroup/HttpApiEndpoint definitions, handler implementation, authentication middleware |
| 06 | [authorization](./06-authorization.md) | Policy helper function, per-feature policy services, policyUse composition, system actor |
| 07 | [repository](./07-repository.md) | SqlModel.makeRepository CRUD, custom SqlSchema queries, transactions, error handling |
| 08 | [testing](./08-testing.md) | makeTestLayer factory, it.effect tests, partial mock implementations, Test static layers |
| 09 | [naming-conventions](./09-naming-conventions.md) | File naming (PascalCase), function naming (camelCase), service identifiers, API naming |
| 10 | [imports-exports](./10-imports-exports.md) | Named exports, type imports, explicit .js extensions, service/API class exports |
