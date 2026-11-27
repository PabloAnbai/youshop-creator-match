// Lets `node --test` run .ts files across Node 20.6+ / 22+ (with or without module.registerHooks).
import { existsSync, readFileSync } from "node:fs";
import * as moduleApi from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:") && !/\.[a-z]+$/i.test(specifier)) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) {
      return { url: candidate.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !url.endsWith(".ts")) return nextLoad(url, context);
  const { outputText } = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}

if (typeof moduleApi.registerHooks === "function") {
  moduleApi.registerHooks({ resolve, load });
} else if (typeof moduleApi.register === "function") {
  moduleApi.register(import.meta.url);
}
