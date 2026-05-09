import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import preferObjectParams from "./eslint/rules/prefer-object-params.mjs";

const webFiles = ["apps/web/src/**/*.{ts,tsx}"];

const opencutEslintPlugin = {
	meta: {
		name: "eslint-plugin-opencut",
		version: "0.0.0",
	},
	rules: {
		"prefer-object-params": preferObjectParams,
	},
};

function scopeToWebFiles(config) {
	return {
		...config,
		files: webFiles,
	};
}

export default [
	{
		ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/build/**"],
	},
	{
		files: webFiles,
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: "error",
		},
		settings: {
			react: {
				version: "detect",
			},
		},
	},
	scopeToWebFiles(js.configs.recommended),
	...tseslint.configs.recommended.map(scopeToWebFiles),
	scopeToWebFiles(react.configs.flat.recommended),
	scopeToWebFiles(react.configs.flat["jsx-runtime"]),
	scopeToWebFiles(reactHooks.configs.flat["recommended-latest"]),
	scopeToWebFiles(jsxA11y.flatConfigs.recommended),
	scopeToWebFiles(next.configs["core-web-vitals"]),
	{
		files: webFiles,
		plugins: {
			opencut: opencutEslintPlugin,
		},
		rules: {
			"@typescript-eslint/no-empty-object-type": "warn",
			"@typescript-eslint/no-unsafe-type-assertion": "error",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"no-empty": "warn",
			"opencut/prefer-object-params": "error",
			
			// `react/prop-types` is for the JS-era React workflow where runtime
			// `propTypes` declarations are the prop contract. In this TS-only
			// scope the prop types already are the contract; the rule's only
			// effect is false positives when it can't trace destructured props
			// back to a `propTypes` definition that doesn't exist.
			"react/prop-types": "off",
		},
	},
	scopeToWebFiles(eslintConfigPrettier),
];
