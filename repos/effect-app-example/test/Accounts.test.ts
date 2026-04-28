import { assert, describe, it } from "@effect/vitest"
import { Accounts } from "app/Accounts"
import { AccountsRepo } from "app/Accounts/AccountsRepo"
import { UsersRepo } from "app/Accounts/UsersRepo"
import { Account, AccountId } from "app/Domain/Account"
import { Email } from "app/Domain/Email"
import { withSystemActor } from "app/Domain/Policy"
import { User, UserId } from "app/Domain/User"
import { makeTestLayer } from "app/lib/Layer"
import { DateTime, Effect, Layer, Option, pipe } from "effect"
import { accessTokenFromString, type AccessToken } from "../src/Domain/AccessToken.ts"

describe("Accounts", () => {
  it.effect("createUser", () =>
    Effect.gen(function*() {
      const accounts = yield* Accounts
      const user = yield* pipe(
        accounts.createUser({ email: "test@example.com" as Email }),
        withSystemActor
      )
      assert.strictEqual(user.id, 1)
      assert.strictEqual(user.accountId, 123)
      assert.strictEqual(user.account.id, 123)
      assert.strictEqual(user.accessToken, "test-uuid" as AccessToken)
    }).pipe(
      Effect.provide(
        Accounts.Test.pipe(
          Layer.provide(
            makeTestLayer(AccountsRepo)({
              insert: (account) =>
                Effect.map(
                  DateTime.now,
                  (now) =>
                    new Account({
                      ...account,
                      id: 123 as AccountId,
                      createdAt: now,
                      updatedAt: now
                    })
                )
            })
          ),
          Layer.provide(
            makeTestLayer(UsersRepo)({
              insert: (user) =>
                Effect.map(
                  DateTime.now,
                  (now) =>
                    new User({
                      ...user,
                      id: 1 as UserId,
                      createdAt: now,
                      updatedAt: now
                    })
                )
            })
          )
        )
      )
    ))
  it.effect("updateUser", () =>
    Effect.gen(function*() {
      const accounts = yield* Accounts
      const userId = 1 as UserId
      const updatedUser = { email: "updated@example.com" as Email }

      const updatedUserResult = yield* pipe(
        accounts.updateUser(userId, updatedUser),
        withSystemActor
      )

      assert.strictEqual(updatedUserResult.id, 1)
      assert.strictEqual(updatedUserResult.email, updatedUser.email)
      assert.strictEqual(updatedUserResult.accountId, 123)
    }).pipe(
      Effect.provide(
        Accounts.Test.pipe(
          Layer.provide(
            makeTestLayer(AccountsRepo)({
              insert: (account) =>
                Effect.map(
                  DateTime.now,
                  (now) =>
                    new Account({
                      ...account,
                      id: 123 as AccountId,
                      createdAt: now,
                      updatedAt: now
                    })
                )
            })
          ),
          Layer.provide(
            makeTestLayer(UsersRepo)({
              findById: (id: UserId) =>
                Effect.succeed(
                  Option.some(
                    new User({
                      id,
                      email: "test@example.com" as Email,
                      accountId: 123 as AccountId,
                      createdAt: Effect.runSync(DateTime.now),
                      updatedAt: Effect.runSync(DateTime.now),
                      accessToken: accessTokenFromString("test-uuid")
                    })
                  )
                ),
              update: (user) =>
                Effect.map(
                  DateTime.now,
                  (now) =>
                    new User({
                      ...user,
                      updatedAt: now,
                      createdAt: now
                    })
                )
            })
          )
        )
      )
    ))
  it.effect("findUserByAccessToken", () =>
    Effect.gen(function*() {
      const accounts = yield* Accounts
      const apiKey = accessTokenFromString("test-uuid")
      const user = yield* pipe(
        accounts.findUserByAccessToken(apiKey),
        withSystemActor
      )
      if (Option.isSome(user)) {
        const userValue = user.value
        assert.strictEqual(userValue.id, 1)
        assert.strictEqual(userValue.accountId, 123)
        assert.strictEqual(userValue.email, "test@example.com" as Email)
      }
      assert.strictEqual(Option.isSome(user), true)
    }).pipe(
      Effect.provide(
        Accounts.Test.pipe(
          Layer.provide(
            makeTestLayer(AccountsRepo)({
              insert: (account) =>
                Effect.map(
                  DateTime.now,
                  (now) =>
                    new Account({
                      ...account,
                      id: 123 as AccountId,
                      createdAt: now,
                      updatedAt: now
                    })
                )
            })
          ),
          Layer.provide(
            makeTestLayer(UsersRepo)({
              findByAccessToken: (apiKey) =>
                Effect.succeed(
                  Option.some(
                    new User({
                      id: 1 as UserId,
                      email: "test@example.com" as Email,
                      accountId: 123 as AccountId,
                      createdAt: Effect.runSync(DateTime.now),
                      updatedAt: Effect.runSync(DateTime.now),
                      accessToken: apiKey
                    })
                  )
                )
            })
          )
        )
      )
    ))

  it.effect("findUserById", () =>
    Effect.gen(function*() {
      const accounts = yield* Accounts
      const userId = 1 as UserId
      const user = yield* pipe(
        accounts.findUserById(userId),
        withSystemActor
      )
      if (Option.isSome(user)) {
        const userValue = user.value
        assert.strictEqual(userValue.id, 1)
        assert.strictEqual(userValue.accountId, 123)
        assert.strictEqual(userValue.email, "test@example.com" as Email)
      }
      assert.strictEqual(Option.isSome(user), true)
    }).pipe(
      Effect.provide(
        Accounts.Test.pipe(
          Layer.provide(
            makeTestLayer(AccountsRepo)({
              insert: (account) =>
                Effect.map(
                  DateTime.now,
                  (now) =>
                    new Account({
                      ...account,
                      id: 123 as AccountId,
                      createdAt: now,
                      updatedAt: now
                    })
                )
            })
          ),
          Layer.provide(
            makeTestLayer(UsersRepo)({
              findById: (id: UserId) =>
                Effect.succeed(
                  Option.some(
                    new User({
                      id,
                      email: "test@example.com" as Email,
                      accountId: 123 as AccountId,
                      createdAt: Effect.runSync(DateTime.now),
                      updatedAt: Effect.runSync(DateTime.now),
                      accessToken: accessTokenFromString("test-uuid")
                    })
                  )
                )
            })
          )
        )
      )
    ))
  it.effect("embellishUser", () =>
    Effect.gen(function*() {
      const accounts = yield* Accounts
      const user = new User({
        id: 1 as UserId,
        email: "test@example.com" as Email,
        accountId: 123 as AccountId,
        createdAt: Effect.runSync(DateTime.now),
        updatedAt: Effect.runSync(DateTime.now),
        accessToken: accessTokenFromString("test-uuid")
      })
      const embellishedUser = yield* pipe(
        accounts.embellishUser(user),
        withSystemActor
      )
      assert.strictEqual(embellishedUser.id, 1)
      assert.strictEqual(embellishedUser.account.id, 123)
      assert.strictEqual(embellishedUser.email, "test@example.com")
    }).pipe(
      Effect.provide(
        Accounts.Test.pipe(
          Layer.provide(
            makeTestLayer(AccountsRepo)({
              findById: (accountId: AccountId) =>
                Effect.succeed(
                  Option.some(
                    new Account({
                      id: accountId,
                      createdAt: Effect.runSync(DateTime.now),
                      updatedAt: Effect.runSync(DateTime.now)
                    })
                  )
                )
            })
          ),
          Layer.provide(
            makeTestLayer(UsersRepo)({
              findById: (id: UserId) =>
                Effect.succeed(
                  Option.some(
                    new User({
                      id,
                      email: "test@example.com" as Email,
                      accountId: 123 as AccountId,
                      createdAt: Effect.runSync(DateTime.now),
                      updatedAt: Effect.runSync(DateTime.now),
                      accessToken: accessTokenFromString("test-uuid")
                    })
                  )
                )
            })
          )
        )
      )
    ))
})
