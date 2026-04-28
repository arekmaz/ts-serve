# Effect Patterns

## Service Definition

Services extend `ServiceMap.Service` with a `make` function returning the implementation:

```typescript
export class Accounts extends ServiceMap.Service<Accounts>()("Accounts", {
  make,
}) {
  static layer = Layer.effect(Accounts)(make).pipe(
    Layer.provide(
      Layer.mergeAll(SqlLive, AccountsRepo.layer, UsersRepo.layer, Uuid.layer),
    ),
  );
  static Test = Layer.effect(Accounts)(make).pipe(
    Layer.provide(Layer.mergeAll(SqlTest, Uuid.Test)),
  );
}
```

## Effect.gen for Sequential Operations

Use generator syntax for sequential async operations:

```typescript
const make = Effect.gen(function* () {
  const accounts = yield* Accounts;
  const policy = yield* AccountsPolicy;
  const userRepo = yield* UsersRepo;

  function createUser(user: typeof User.jsonCreate.Type) {
    return Effect.gen(function* () {
      const account = yield* accountRepo.insert(Account.insert.makeUnsafe({}));
      const accessToken = yield* uuid.generate.pipe(Effect.map(accessTokenFromString));
      return yield* userRepo.insert(User.insert.makeUnsafe({
        ...user,
        accountId: account.id,
        accessToken,
      }));
    });
  }

  return { createUser } as const;
});
```

## Pipe-Based Composition

For linear data transformations, use `.pipe()`:

```typescript
const createUser = (user: typeof User.jsonCreate.Type) =>
  accountRepo.insert(Account.insert.makeUnsafe({})).pipe(
    Effect.tap((account) => Effect.annotateCurrentSpan("account", account)),
    Effect.bindTo("account"),
    Effect.bind("accessToken", () =>
      uuid.generate.pipe(Effect.map(accessTokenFromString)),
    ),
    Effect.bind("user", ({ accessToken, account }) =>
      userRepo.insert(User.insert.makeUnsafe({
        ...user,
        accountId: account.id,
        accessToken,
      })),
    ),
    Effect.map(({ account, user }) => new UserWithSensitive({ ...user, account })),
    sql.withTransaction,
    Effect.orDie,
    Effect.withSpan("Accounts.createUser", { attributes: { user } }),
  );
```

## Layer Composition

Compose dependencies via `Layer.provide` and `Layer.mergeAll`:

```typescript
static layer = Layer.effect(Accounts)(make).pipe(
  Layer.provide(
    Layer.mergeAll(SqlLive, AccountsRepo.layer, UsersRepo.layer, Uuid.layer),
  ),
);
```

## Context Service Pattern

For request-scoped context like current user:

```typescript
export class CurrentUser extends ServiceMap.Service<CurrentUser, User>()(
  "Domain/User/CurrentUser",
) {}

// Access
const actor = yield* CurrentUser;

// Provide
Effect.provideService(CurrentUser, user)
```

## Tracing

Add spans to operations for observability:

```typescript
Effect.withSpan("UsersRepo.findById", { attributes: { id } })
Effect.annotateCurrentSpan("account", account)
```
