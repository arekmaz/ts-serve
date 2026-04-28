# Testing Patterns

## Test Layer Factory

Create mock layers using partial implementations:

```typescript
const makeTestLayer =
  <I, S extends object>(tag: ServiceMap.Key<I, S>) =>
  (service: Partial<S>): Layer.Layer<I> =>
    Layer.succeed(tag)(makeUnimplementedProxy(tag.key, service));

const makeUnimplementedProxy = <S extends object>(
  name: string,
  service: Partial<S>,
): S =>
  new Proxy(service as S, {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop as keyof S];
      }
      return () => {
        throw new Error(`${name}.${String(prop)} is not implemented`);
      };
    },
  });
```

## Effect Tests

Use `it.effect()` for effect-based tests:

```typescript
it.effect("createUser", () =>
  Effect.gen(function* () {
    const accounts = yield* Accounts;
    const user = yield* pipe(
      accounts.createUser({ email: "test@example.com" as Email }),
      withSystemActor,
    );
    assert.strictEqual(user.id, 1);
  }).pipe(
    Effect.provide(
      Accounts.Test.pipe(
        Layer.provide(
          makeTestLayer(AccountsRepo)({
            insert: (account) =>
              Effect.map(DateTime.now, (now) =>
                new Account({
                  ...account,
                  id: 123 as AccountId,
                  createdAt: now,
                  updatedAt: now,
                }),
              ),
          }),
        ),
      ),
    ),
  ),
);
```

## Test Service Layers

Services provide `Test` static property with mocked dependencies:

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

## Mocking Repositories

Provide partial implementations for tests:

```typescript
makeTestLayer(UsersRepo)({
  findById: (id) =>
    Effect.succeed(
      Option.some(
        new User({
          id,
          email: "test@example.com" as Email,
          accountId: 1 as AccountId,
          accessToken: accessTokenFromString("test"),
          createdAt: DateTime.unsafeMake(0),
          updatedAt: DateTime.unsafeMake(0),
        }),
      ),
    ),
})
```

## Assertions

Use Node.js assert:

```typescript
import { assert } from "node:assert";

assert.strictEqual(user.id, 1);
assert.deepStrictEqual(result, expected);
```
