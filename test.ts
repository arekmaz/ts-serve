import { eraseTypes } from "./src/eraser.ts"

function test(name: string, input: string, expected: string): void {
  const result = eraseTypes(input)
  if (result.length !== input.length) {
    console.log(`FAIL (length): ${name} — input ${input.length}, output ${result.length}`)
    console.log(`  input:    ${JSON.stringify(input)}`)
    console.log(`  got:      ${JSON.stringify(result)}`)
    return
  }
  if (result !== expected) {
    console.log(`FAIL: ${name}`)
    console.log(`  expected: ${JSON.stringify(expected)}`)
    console.log(`  got:      ${JSON.stringify(result)}`)
  } else {
    console.log(`PASS: ${name}`)
  }
}

test(
  "variable type annotation",
  `const x: string = "hello"`,
  `const x         = "hello"`,
)

test(
  "function param annotation",
  `function foo(x: number, y: string) {}`,
  `function foo(x        , y        ) {}`,
)

test(
  "return type annotation",
  `function foo(x: number): string { return "" }`,
  `function foo(x        )         { return "" }`,
)

test(
  "interface declaration",
  `interface Foo { bar: string }\nconst x = 1`,
  `;                            \nconst x = 1`,
)

test(
  "type alias",
  `type Foo = string | number\nconst x = 1`,
  `;                         \nconst x = 1`,
)

test(
  "import type",
  `import type { Foo } from "./bar"\nconst x = 1`,
  `;                               \nconst x = 1`,
)

test(
  "inline type in import",
  `import { type Foo, Bar } from "./bar"`,
  `import {            Bar } from "./bar"`,
)

test(
  "as expression",
  `const x = y as string`,
  `const x = y          `,
)

test(
  "satisfies expression",
  "const x = y satisfies Record<string, number>",
  "const x = y                                 ",
)

test(
  "non-null assertion",
  `x!.foo`,
  `x .foo`,
)

test(
  "generic function call",
  `foo<string>(x)`,
  `foo        (x)`,
)

test(
  "string containing type-like syntax",
  `const s = "const x: string"`,
  `const s = "const x: string"`,
)

test(
  "declare const",
  `declare const x: string\nconst y = 1`,
  `;                      \nconst y = 1`,
)

test(
  "export type",
  `export type { Foo } from "./bar"`,
  `;                               `,
)

test(
  "generic function definition",
  `function foo<T>(x: T): T { return x }`,
  `function foo   (x   )    { return x }`,
)

test(
  "arrow function with type annotation",
  `const f = (x: number): string => x.toString()`,
  `const f = (x        )          => x.toString()`,
)

test(
  "inline type - last specifier",
  `import { Bar, type Foo } from "./bar"`,
  `import { Bar            } from "./bar"`,
)

test(
  "nested generics",
  `foo<Map<string, Array<number>>>(x)`,
  `foo                            (x)`,
)

test(
  "let with type",
  `let x: number = 5`,
  `let x         = 5`,
)

test(
  "comment containing type syntax",
  `// const x: string\nconst y = 1`,
  `// const x: string\nconst y = 1`,
)

test(
  "template literal containing type syntax",
  "const s = `x: ${y}`",
  "const s = `x: ${y}`",
)
