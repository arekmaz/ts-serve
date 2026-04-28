# HTTP API Patterns

## Endpoint Definition

Define endpoints using `HttpApiGroup` and `HttpApiEndpoint`:

```typescript
export class AccountsApi extends HttpApiGroup.make("accounts")
  .add(
    HttpApiEndpoint.post("createUser", "/users", {
      success: UserWithSensitive.json,
      payload: User.jsonCreate,
    }),
  )
  .add(
    HttpApiEndpoint.get("getUserMe", "/users/me", {
      success: UserWithSensitive.json,
      error: Unauthorized,
    }),
  )
  .add(
    HttpApiEndpoint.patch("updateUser", "/users/:id", {
      params: { id: UserIdFromString },
      success: User.json,
      payload: User.jsonUpdate,
      error: [UserNotFound, Unauthorized],
    }),
  )
  .annotate(OpenApi.Title, "Accounts")
  .annotate(OpenApi.Description, "Manage user accounts") {}
```

## Root API Composition

Compose all API groups:

```typescript
export class Api extends HttpApi.make("Api")
  .add(AccountsApi)
  .add(GroupsApi)
  .add(PeopleApi)
  .annotate(OpenApi.Title, "Reservas API") {}
```

## Handler Implementation

Implement handlers using `HttpApiBuilder.group`:

```typescript
export const HttpAccountsLive = HttpApiBuilder.group(
  Api,
  "accounts",
  (handlers) =>
    Effect.gen(function* () {
      const accounts = yield* Accounts;
      const policy = yield* AccountsPolicy;

      return handlers
        .handle("createUser", ({ payload }) =>
          pipe(
            accounts.createUser(payload),
            withSystemActor,
          )
        )
        .handle("updateUser", ({ params, payload }) =>
          pipe(
            accounts.updateUser(params.id, payload),
            policyUse(policy.canUpdate(params.id)),
          )
        )
        .handle("getUserMe", () =>
          pipe(
            accounts.getMe(),
            policyUse(policy.canGetMe),
          )
        );
    }),
).pipe(
  Layer.provide(Accounts.layer),
  Layer.provide(AccountsPolicy.layer),
);
```

## Authentication Middleware

Extract current user from request:

```typescript
const withCurrentUser = <A, E, R>(
  effect: Effect.Effect<A, E, R | CurrentUser>,
): Effect.Effect<A, E | Unauthorized, Exclude<R, CurrentUser> | Accounts | HttpServerRequest.HttpServerRequest> =>
  Effect.gen(function* () {
    const accounts = yield* Accounts;
    const request = yield* HttpServerRequest.HttpServerRequest;
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return yield* Effect.fail(new Unauthorized({...}));
    }
    const token = authHeader.slice(7);
    const user = yield* accounts.findByAccessToken(accessTokenFromString(token));
    return yield* effect.pipe(Effect.provideService(CurrentUser, user));
  });
```

## OpenAPI Integration

Swagger docs auto-generated at `/docs` endpoint. Annotate groups and endpoints:

```typescript
.annotate(OpenApi.Title, "Accounts")
.annotate(OpenApi.Description, "Manage user accounts")
```
