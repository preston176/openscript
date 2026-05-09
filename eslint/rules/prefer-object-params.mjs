export default {
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Prefer a single destructured object parameter over multiple positional parameters",
		},
		schema: [],
		messages: {
			preferObjectParams:
				"Use a single destructured object parameter instead of multiple positional parameters. Example: function someFunction({ name, age }: { name: string, age: number }) {}",
		},
	},
	create(context) {
		function isCallArgument(node) {
			return (
				node &&
				(node.type === "CallExpression" ||
					node.type === "NewExpression" ||
					node.type === "OptionalCallExpression")
			);
		}

		function isDirectCallback(node) {
			const parent = node.parent;
			return (
				isCallArgument(parent) && parent.arguments.includes(node)
			);
		}

		// Some APIs receive callbacks via a property somewhere inside an inline
		// option object (e.g. `persist(state, { migrate: (s, v) => ... })` or
		// `betterAuth({ rateLimit: { customStorage: { set: (k, v) => ... }}})`).
		// The caller still dictates the signature, so the same carve-out as
		// `isDirectCallback` applies. Pre-declared option objects don't qualify —
		// once you name the object, the signature is yours to evolve.
		function isInlineOptionCallback(node) {
			let current = node;
			let property = current.parent;
			if (
				!property ||
				property.type !== "Property" ||
				property.value !== current
			) {
				return false;
			}

			let objectExpression = property.parent;
			while (objectExpression?.type === "ObjectExpression") {
				const parent = objectExpression.parent;
				if (isCallArgument(parent) && parent.arguments.includes(objectExpression)) {
					return true;
				}

				if (
					parent?.type !== "Property" ||
					parent.value !== objectExpression
				) {
					return false;
				}

				property = parent;
				objectExpression = property.parent;
			}

			return false;
		}

		// Type predicates (`x is Foo`) require a positional subject by language
		// rule, so the readability/evolution argument doesn't apply. AGENTS.md
		// carves these out explicitly.
		function isTypePredicate(node) {
			return node.returnType?.typeAnnotation?.type === "TSTypePredicate";
		}

		function reportIfNeeded(node) {
			if (
				node.params.length <= 1 ||
				isDirectCallback(node) ||
				isInlineOptionCallback(node) ||
				isTypePredicate(node)
			) {
				return;
			}

			// Report from the function's first line through params[1] so a
			// conventional `// eslint-disable-next-line` placed above the
			// declaration suppresses the violation. The directive matches
			// against `loc.start.line`, which must land on the function
			// declaration line — not on a later parameter row.
			context.report({
				node,
				loc: {
					start: node.loc.start,
					end: node.params[1].loc.end,
				},
				messageId: "preferObjectParams",
			});
		}

		return {
			ArrowFunctionExpression: reportIfNeeded,
			FunctionDeclaration: reportIfNeeded,
			FunctionExpression: reportIfNeeded,
		};
	},
};
