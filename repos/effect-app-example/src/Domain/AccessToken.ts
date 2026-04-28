import { Redacted, Schema } from "effect";

export const AccessToken = Schema.String.pipe(Schema.brand("AccessToken"));
export type AccessToken = typeof AccessToken.Type;

export const AccessTokenRedacted = Schema.Redacted(AccessToken);
export type AccessTokenRedacted = typeof AccessTokenRedacted.Type;

export function accessTokenFromString(token: string): AccessToken {
  return token as AccessToken;
}

export function accessTokenRedactedFromString(token: string): AccessTokenRedacted {
  return Redacted.make(token as AccessToken);
}
