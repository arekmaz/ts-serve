# Repository Patterns

## Repository Service

Define repositories using `SqlModel.makeRepository`:

```typescript
const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const repo = yield* SqlModel.makeRepository(User, {
    tableName: "users",
    spanPrefix: "UsersRepo",
    idColumn: "id",
  });

  function findById(id: UserId) {
    return pipe(
      repo.findById(id),
      Effect.orDie,
      Effect.withSpan("UsersRepo.findById", { attributes: { id } }),
    );
  }

  return {
    insert: repo.insert,
    update: repo.update,
    delete: repo.delete,
    findById,
  } as const;
});

export class UsersRepo extends ServiceMap.Service<UsersRepo>()(
  "Accounts/UsersRepo",
  { make },
) {
  static layer = Layer.effect(UsersRepo)(make).pipe(Layer.provide(SqlLive));
  static Test = makeTestLayer(UsersRepo)({});
}
```

## Auto-Generated CRUD

`SqlModel.makeRepository` provides:

- `repo.insert` - Insert new record
- `repo.update` - Update existing record
- `repo.delete` - Delete record
- `repo.findById` - Find by primary key

## Custom Queries

Define custom queries using `SqlSchema`:

```typescript
const findByAccessTokenSchema = SqlSchema.findOneOption({
  Request: AccessToken,
  Result: User,
  execute: (key) => sql`select * from users where accessToken = ${key}`,
});

function findByAccessToken(apiKey: AccessToken) {
  return pipe(
    findByAccessTokenSchema(apiKey),
    Effect.orDie,
    Effect.withSpan("UsersRepo.findByAccessToken"),
  );
}
```

## SQL Template Literals

Use tagged template literals for queries:

```typescript
sql`select * from users where accessToken = ${key}`
sql`select * from groups where accountId = ${accountId}`
```

## Transactions

Wrap operations in transactions:

```typescript
accountRepo.insert(Account.insert.makeUnsafe({})).pipe(
  Effect.bind("user", ({ account }) =>
    userRepo.insert(User.insert.makeUnsafe({...})),
  ),
  sql.withTransaction,
);
```

## Error Handling

Convert SQL errors to defects:

```typescript
Effect.orDie
```

Or handle specifically:

```typescript
Effect.catchTag("SqlError", (err) => Effect.die(err))
```
