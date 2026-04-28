import { Schema } from "effect";

export const Email = Schema.String.pipe(
  Schema.check(
    Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  ),
  Schema.annotate({
    title: "Email",
    description: "An email address",
  }),
  Schema.brand("Email"),
);

export type Email = typeof Email.Type;
