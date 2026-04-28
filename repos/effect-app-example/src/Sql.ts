import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { identity, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { fileURLToPath } from "url";
import { makeTestLayer } from "./lib/Layer.ts";

const ClientLive = SqliteClient.layer({
  filename: "data/db.sqlite",
});

const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(
    fileURLToPath(new URL("./migrations", import.meta.url)),
  ),
}).pipe(Layer.provide(NodeFileSystem.layer), Layer.provide(NodePath.layer));

export const SqlLive = MigratorLive.pipe(Layer.provideMerge(ClientLive));

export const SqlTest = makeTestLayer(SqlClient.SqlClient)({
  withTransaction: identity,
});
