# Naming Conventions

## Files

| Type | Convention | Examples |
|------|------------|----------|
| Domain models | PascalCase | `User.ts`, `Account.ts`, `Group.ts` |
| API definitions | `Api.ts` per module | `Accounts/Api.ts` |
| HTTP handlers | `Http.ts` per module | `Accounts/Http.ts` |
| Policies | `Policy.ts` per module | `Accounts/Policy.ts` |
| Repositories | `Repo.ts` or `{Entity}Repo.ts` | `UsersRepo.ts`, `Repo.ts` |
| Services | PascalCase | `Uuid.ts`, `Sql.ts`, `Tracing.ts` |
| Migrations | Sequential with descriptor | `00001_create users.ts` |

## Types and Schemas

| Type | Convention | Examples |
|------|------------|----------|
| Branded types | PascalCase | `UserId`, `Email`, `AccessToken` |
| Type conversion schemas | `{Type}From{Source}` | `UserIdFromString` |
| Model classes | PascalCase | `User`, `Account`, `Group` |
| Error classes | PascalCase, descriptive | `UserNotFound`, `Unauthorized` |

## Variables and Functions

| Type | Convention | Examples |
|------|------------|----------|
| Functions | camelCase, named | `function createUser()` |
| Variables | camelCase | `const userRepo`, `const sql` |
| Constants | camelCase or PascalCase for schemas | `const UserId = Schema...` |
| Generic type vars | Single uppercase letters | `<A, E, R>` |

## Service Identifiers

Service tags use path-like naming:

```typescript
"Accounts"
"Accounts/UsersRepo"
"Accounts/Policy"
"Domain/User/CurrentUser"
```

## API Groups and Endpoints

```typescript
HttpApiGroup.make("accounts")    // lowercase group name
HttpApiEndpoint.post("createUser", "/users", {...})  // camelCase action
HttpApiEndpoint.get("getUserMe", "/users/me", {...})
HttpApiEndpoint.patch("updateUser", "/users/:id", {...})
```

## Avoid

- Arrow functions for top-level definitions (use named functions)
- Prefixing private members with `_`
- Hungarian notation
- Abbreviations (use full words)
