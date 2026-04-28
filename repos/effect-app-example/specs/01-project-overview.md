# Project Overview

## Tech Stack

- **Language:** TypeScript 5.6.3 (strict mode)
- **Core Framework:** Effect v4.0.0-beta.38
- **Runtime:** Node.js with pnpm
- **Database:** SQLite via @effect/sql-sqlite-node
- **Observability:** OpenTelemetry with Honeycomb integration
- **Testing:** Vitest 3.2.4
- **Formatting:** ESLint 9.10.0 with dprint

## Directory Structure

```
src/
├── Domain/           # Domain models, branded types, errors
├── Accounts/         # User accounts feature module
├── Groups/           # Groups feature module
├── People/           # People/members feature module
├── lib/              # Utilities
├── migrations/       # Database migrations
├── Api.ts            # Root API definition
├── Http.ts           # HTTP server setup
├── Sql.ts            # SQL client configuration
├── Uuid.ts           # UUID generation service
├── Tracing.ts        # OpenTelemetry setup
└── main.ts           # Application entry point
```

## Feature Module Structure

Each feature follows this pattern:

```
Feature/
├── Api.ts          # HttpApiGroup endpoint definitions
├── Http.ts         # HTTP handler implementation
├── Repo.ts         # Database repository
└── Policy.ts       # Authorization policies
```

## Code Style Rules

- Indent: 2 spaces
- Line width: 120 characters
- No semicolons (ASI)
- Double quotes always
- No trailing commas
- Force parentheses on arrow functions
- Array generic syntax: `Array<T>` not `T[]`
- Sorted destructure keys (enforced)
- Object shorthand (enforced)
- Type imports with `type` keyword
- File extensions always explicit `.js` in imports
