import { afterAll, describe, it } from "bun:test";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import rule from "../prefer-object-params.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.afterAll = afterAll;

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tseslint.parser,
		parserOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			ecmaFeatures: { jsx: true },
		},
	},
});

const error = { messageId: "preferObjectParams" };

ruleTester.run("prefer-object-params", rule, {
	valid: [
		{ code: "function f() {}" },
		{ code: "function f(a) {}" },
		{ code: "const f = (a) => a;" },
		{ code: "const f = function (a) { return a; };" },
		{ code: "function f({ a, b }) { return a + b; }" },
		{ code: "function f({ a, b }: { a: number; b: number }) { return a + b; }" },

		// Direct callbacks: positional args are dictated by the caller.
		{ code: "[1, 2, 3].reduce((acc, cur) => acc + cur, 0);" },
		{ code: "arr.map((value, index) => value + index);" },
		{ code: "new Promise((resolve, reject) => {});" },
		{ code: "maybeFn?.((a, b) => a + b);" },

		// Inline option-object callbacks: caller dictates the signature
		// (e.g. zustand's `persist`, tanstack-query's `onSuccess`).
		{ code: "someAPI({ on: (a, b) => a + b });" },
		{
			code: "persist((set, get) => ({}), { migrate: (state, version) => state });",
		},
		{ code: "new Foo({ handler: (a, b) => a + b });" },
		{ code: "maybeFn?.({ handler: (a, b) => a + b });" },

		// Deeply-nested inline option callbacks still qualify: the entire
		// option tree is supplied at the call site, so the caller dictates
		// every signature inside it. Real example: better-auth's
		// `betterAuth({ rateLimit: { customStorage: { set: (k, v) => ... }}})`.
		{ code: "someAPI({ outer: { handler: (a, b) => a + b } });" },

		// Type predicates require a positional subject.
		{
			code: "function isFoo(x: unknown, ctx: Ctx): x is Foo { return true; }",
		},
		{
			code: "const isFoo = (x: unknown, ctx: Ctx): x is Foo => true;",
		},
	],
	invalid: [
		{
			code: "function f(a, b) { return a + b; }",
			errors: [error],
		},
		{
			code: "const f = (a, b) => a + b;",
			errors: [error],
		},
		{
			code: "const f = function (a, b) { return a + b; };",
			errors: [error],
		},
		{
			code: "function f(a, b, c) { return a + b + c; }",
			errors: [error],
		},
		{
			code: "function formatTime(seconds: number, fps: number) { return seconds * fps; }",
			errors: [error],
		},
		// A callback assigned to a name and passed indirectly is still a
		// signature the author controls; the carve-out is intentionally narrow
		// to direct callbacks.
		{
			code: "const cb = (a, b) => a + b; arr.reduce(cb, 0);",
			errors: [error],
		},
		// Pre-declared option object: once the object is named, its callback
		// signatures are the author's to evolve.
		{
			code: "const opts = { handler: (a, b) => a + b }; someAPI(opts);",
			errors: [error],
		},
		// The error must point at the function's declaration line, so a
		// `// eslint-disable-next-line` placed above the declaration (the
		// conventional spot) suppresses the violation even when the
		// signature spans multiple lines. Reporting at a parameter row
		// instead leaves the directive inert and `reportUnusedDisableDirectives`
		// then flags every suppressed call site.
		{
			code: [
				"function f(",
				"\ta: number,",
				"\tb: number,",
				") { return a + b; }",
			].join("\n"),
			errors: [{ messageId: "preferObjectParams", line: 1 }],
		},
	],
});
