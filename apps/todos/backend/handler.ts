import { ServiceMap, Effect, Layer, Ref, Schema } from "effect";
import { HttpRouter, HttpMiddleware } from "effect/unstable/http";
import { HttpServerRequest } from "effect/unstable/http";
import { HttpServerResponse } from "effect/unstable/http";

const TodoId = Schema.String.pipe(Schema.brand("TodoId"));
type TodoId = typeof TodoId.Type;

const Todo = Schema.Struct({
  id: TodoId,
  text: Schema.String,
  done: Schema.Boolean,
});
type Todo = typeof Todo.Type;

const CreateTodo = Schema.Struct({
  text: Schema.String,
});

const UpdateTodo = Schema.Struct({
  text: Schema.optional(Schema.String),
  done: Schema.optional(Schema.Boolean),
});

const TodoStore = ServiceMap.Service<Ref.Ref<ReadonlyArray<Todo>>>("TodoStore");

const TodoStoreLive = Layer.effect(
  TodoStore,
  Ref.make<ReadonlyArray<Todo>>([
    { id: "adfasdf" as TodoId, text: "test", done: true },
  ]),
);

function generateId(): TodoId {
  return crypto.randomUUID() as TodoId;
}

function parseJsonBody<S extends Schema.Top>(schema: S) {
  const decode = Schema.decodeUnknownEffect(schema);
  return Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest.asEffect();
    const raw = yield* request.json;
    return yield* decode(raw);
  });
}

function getRouteParam(name: string) {
  return Effect.map(
    HttpRouter.RouteContext.asEffect(),
    (ctx) => ctx.params[name] ?? "",
  );
}

const getAllTodos = Effect.gen(function* () {
  const store = yield* TodoStore;
  const todos = yield* Ref.get(store);
  return yield* HttpServerResponse.json(todos);
});

const createTodo = Effect.gen(function* () {
  const store = yield* TodoStore;
  const { text } = yield* parseJsonBody(CreateTodo);
  const todo: Todo = { id: generateId(), text, done: false };
  yield* Ref.update(store, (todos) => [...todos, todo]);
  return yield* HttpServerResponse.json(todo);
});

const getTodo = Effect.gen(function* () {
  const store = yield* TodoStore;
  const id = (yield* getRouteParam("id")) as TodoId;
  const todos = yield* Ref.get(store);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return HttpServerResponse.empty({ status: 404 });
  }
  return yield* HttpServerResponse.json(todo);
});

const updateTodo = Effect.gen(function* () {
  const store = yield* TodoStore;
  const id = (yield* getRouteParam("id")) as TodoId;
  const patch = yield* parseJsonBody(UpdateTodo);
  const todos = yield* Ref.get(store);
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    return HttpServerResponse.empty({ status: 404 });
  }
  const updated: Todo = { ...todos[index], ...patch };
  yield* Ref.set(store, todos.with(index, updated));
  return yield* HttpServerResponse.json(updated);
});

const deleteTodo = Effect.gen(function* () {
  const store = yield* TodoStore;
  const id = (yield* getRouteParam("id")) as TodoId;
  const todos = yield* Ref.get(store);
  if (!todos.some((t) => t.id === id)) {
    return HttpServerResponse.empty({ status: 404 });
  }
  yield* Ref.set(
    store,
    todos.filter((t) => t.id !== id),
  );
  return HttpServerResponse.empty({ status: 204 });
});

const RouterLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const router = yield* HttpRouter.HttpRouter;
    yield* router.add("GET", "/todos", getAllTodos);
    yield* router.add("POST", "/todos", createTodo);
    yield* router.add("GET", "/todos/:id", getTodo);
    yield* router.add("PATCH", "/todos/:id", updateTodo);
    yield* router.add("DELETE", "/todos/:id", deleteTodo);
    yield* router.add("*", "*", HttpServerResponse.empty({ status: 404 }));
  }),
);

const AppLayer = Layer.mergeAll(
  RouterLive,
  HttpRouter.middleware(HttpMiddleware.cors()).layer,
  TodoStoreLive,
);

const { handler, dispose } = HttpRouter.toWebHandler(AppLayer);

export { handler, dispose };
