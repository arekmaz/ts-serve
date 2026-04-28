# Authorization Patterns

## Policy Definition

Define policies using the `policy` helper:

```typescript
export const policy = <Entity extends string, Action extends string, E, R>(
  entity: Entity,
  action: Action,
  f: (actor: User) => Effect.Effect<boolean, E, R>,
): Effect.Effect<
  AuthorizedActor<Entity, Action>,
  E | Unauthorized,
  R | CurrentUser
> =>
  Effect.gen(function* () {
    const actor = yield* CurrentUser;
    const can = yield* f(actor);
    if (!can) {
      return yield* Effect.fail(
        new Unauthorized({
          actorId: actor.id,
          entity,
          action,
        }),
      );
    }
    return authorizedActor(actor);
  });
```

## Policy Service

Create a policy service per feature:

```typescript
const make = Effect.gen(function* () {
  const canUpdate = (toUpdate: UserId) =>
    policy("User", "update", (actor) => Effect.succeed(actor.id === toUpdate));

  const canGetMe = policy("User", "getMe", () => Effect.succeed(true));

  const canCreate = policy("User", "create", () => Effect.succeed(true));

  return { canCreate, canGetMe, canUpdate } as const;
});

export class AccountsPolicy extends ServiceMap.Service<AccountsPolicy>()(
  "Accounts/Policy",
  { make },
) {
  static layer = Layer.effect(AccountsPolicy)(make);
}
```

## Policy Application

Apply policies to effects using `policyUse`:

```typescript
export const policyUse =
  <Actor extends AuthorizedActor<any, any>, E, R>(
    policy: Effect.Effect<Actor, E, R>,
  ) =>
  <A, E2, R2>(
    effect: Effect.Effect<A, E2, R2>,
  ): Effect.Effect<A, E | E2, Exclude<R2, Actor> | R> =>
    policy.pipe(Effect.andThen(effect)) as any;
```

Usage in handlers:

```typescript
.handle("updateUser", ({ params, payload }) =>
  pipe(
    accounts.updateUser(params.id, payload),
    policyUse(policy.canUpdate(params.id)),
  )
)
```

## System Actor

For operations without a user context:

```typescript
const SystemUser = new User({
  id: 0 as UserId,
  accountId: 0 as AccountId,
  email: "system@local" as Email,
  accessToken: accessTokenFromString("system"),
  createdAt: DateTime.unsafeMake(0),
  updatedAt: DateTime.unsafeMake(0),
});

export const withSystemActor = <A, E, R>(
  effect: Effect.Effect<A, E, R | CurrentUser>,
): Effect.Effect<A, E, Exclude<R, CurrentUser>> =>
  effect.pipe(Effect.provideService(CurrentUser, SystemUser)) as any;
```
