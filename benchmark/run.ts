import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { transformSync } from "amaro";
import { eraseTsTypes } from "../src/eraseTsTypes.ts";

const fixturesDir = new URL("fixtures", import.meta.url).pathname;
const fixtures = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".ts"))
  .sort()
  .map(function loadFixture(filename) {
    return {
      name: filename,
      source: readFileSync(join(fixturesDir, filename), "utf-8"),
    };
  });

const WARMUP = 500;
const ITERATIONS = 5000;

function bench(name: string, fn: () => void): number {
  for (let i = 0; i < WARMUP; i++) {
    fn();
  }

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const elapsed = performance.now() - start;
  const opsPerSec = Math.round((ITERATIONS / elapsed) * 1000);
  const avgMs = (elapsed / ITERATIONS).toFixed(4);
  console.log(`  ${name}: ${avgMs}ms/op (${opsPerSec.toLocaleString()} ops/s)`);
  return elapsed;
}

console.log(`Warmup: ${WARMUP} iterations, Bench: ${ITERATIONS} iterations\n`);

for (const fixture of fixtures) {
  console.log(`--- ${fixture.name} (${fixture.source.length} bytes) ---`);

  const tErase = bench("eraseTsTypes", function runErase() {
    eraseTsTypes(fixture.source);
  });

  const tAmaro = bench("amaro      ", function runAmaro() {
    transformSync(fixture.source, { mode: "strip-only" });
  });

  const ratio = tAmaro / tErase;
  console.log(`  eraseTsTypes is ${ratio.toFixed(2)}x ${ratio > 1 ? "faster" : "slower"}\n`);
}
