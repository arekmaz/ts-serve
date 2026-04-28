# Import/Export Patterns

## Named Exports

Prefer named exports for all definitions:

```typescript
export class User extends Model.Class<User>("User")({...}) {}
export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(...) {}
export const UserId = Schema.Number.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;
```

## Type Exports

Export types alongside runtime values:

```typescript
export const UserId = Schema.Number.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;
```

## Type Imports

Use `type` keyword for type-only imports (enforced by linter):

```typescript
import type { UserId } from "./Domain/User.js";
import type { AccountId } from "./Domain/Account.js";
```

## Structured Imports

Import from effect packages:

```typescript
import { Effect, Layer, Option, pipe, ServiceMap } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { SqlClient, SqlSchema } from "@effect/sql";
import { Model } from "@effect/sql/Model";
```

## File Extensions

Always use explicit `.js` extensions in imports (ESM module style):

```typescript
import { Accounts } from "../Accounts.js";
import { Api } from "../Api.js";
import { User, UserId, UserIdFromString } from "./Domain/User.js";
```

## Service Class Exports

Services export the class with static `layer` and `Test` properties:

```typescript
export class Accounts extends ServiceMap.Service<Accounts>()("Accounts", {
  make,
}) {
  static layer = Layer.effect(Accounts)(make).pipe(...);
  static Test = Layer.effect(Accounts)(make).pipe(...);
}
```

## API Group Exports

API groups as exported classes:

```typescript
export class AccountsApi extends HttpApiGroup.make("accounts")
  .add(HttpApiEndpoint.post(...))
  .add(HttpApiEndpoint.get(...))
  .annotate(OpenApi.Title, "Accounts") {}
```

## Handler Layer Exports

HTTP handler layers:

```typescript
export const HttpAccountsLive = HttpApiBuilder.group(Api, "accounts", ...)
  .pipe(Layer.provide(...));
```
