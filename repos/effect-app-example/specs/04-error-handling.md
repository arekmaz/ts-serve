# Error Handling

## Tagged Error Classes

Define domain errors as tagged classes:

```typescript
export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { id: UserId },
) {}

export class Unauthorized extends Schema.TaggedErrorClass<Unauthorized>()(
  "Unauthorized",
  {
    actorId: UserId,
    entity: Schema.String,
    action: Schema.String,
  },
) {
  get message() {
    return `Actor (${this.actorId}) is not authorized to ${this.action} ${this.entity}`;
  }

  static is(u: unknown): u is Unauthorized {
    return Predicate.isTagged(u, "Unauthorized");
  }
}
```

## Option-Based Handling

Handle optional results with `Option.match`:

```typescript
const updateUser = (id: UserId, user: Partial<typeof User.jsonUpdate.Type>) =>
  userRepo.findById(id).pipe(
    Effect.flatMap((option) =>
      Option.match(option, {
        onNone: () => Effect.fail(new UserNotFound({ id })),
        onSome: Effect.succeed,
      }),
    ),
  );
```

## Tag-Based Error Catching

Catch specific errors by tag:

```typescript
Effect.catchTag("SqlError", (err) => Effect.die(err))
```

## Converting Errors to Defects

For unrecoverable errors, convert to defects:

```typescript
Effect.orDie
```

## Error Propagation

Errors propagate through `Effect.flatMap` chains automatically:

```typescript
userRepo.findById(id).pipe(
  Effect.flatMap((option) =>
    Option.match(option, {
      onNone: () => Effect.fail(new UserNotFound({ id })),
      onSome: Effect.succeed,
    }),
  ),
  Effect.flatMap((user) => userRepo.update(user)),
  Effect.catchTag("SqlError", (err) => Effect.die(err)),
);
```
