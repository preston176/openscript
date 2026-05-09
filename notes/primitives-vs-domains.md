# Primitives vs domains

The codebase has a recurring smell: **primitive value types defined inside
domain folders**. The clearest current example is `Transform`, which lives in
`apps/web/src/rendering/index.ts`. Rendering happens to consume it — but so do
`@/timeline`, `@/preview`, `@/animation`, `@/text`, and anything else that
positions things on a 2D canvas. It's not "of" rendering; rendering just owns
the file.

## The test

If a type can be described without mentioning clips, tracks, effects, layers,
keyframes, or any other product concept — and it has no behavior beyond shape
— it's a **primitive**. The moment a type needs to know what a clip is, it
has crossed into domain territory.

Primitives have:

- No domain-specific invariants (a 2D position doesn't care that it's a clip's
position; it's just `{ x, y }`).
- No dependencies on other parts of the app — they're leaves.
- Multiple unrelated consumers across domains.
- A name that would make sense in any 2D editor / video tool / graphics lib.

Domains, in contrast, can name things that only make sense given the rest of
the product (`TimelineElement`, `Effect`, `GraphicDefinition`, `MediaAsset`).

## Why it matters

When a primitive lives in a domain folder, every other domain that consumes it
takes a misleading dependency — `@/timeline` ends up importing from
`@/rendering` not because timeline needs rendering, but because that's where
`Transform` happens to sit. The dependency graph lies, and pieces that should
move freely become anchored to the wrong layer.

## The refactor

Move primitives out of domain folders into a primitives location (somewhere
like `apps/web/src/primitives/`, or split by concern — `geometry/`, `time/`,
`color/`, etc.). Whatever the bucket, the rule is "no product concepts, no
behavior, no upward dependencies".

Don't bulk-move. Each move is deliberate — the right destination depends on
what other primitives already exist and what naming convention has emerged.

## Side effects to watch for

Files often end up parked next to misplaced primitives because they had nowhere
better to live. Example: `apps/web/src/rendering/animation-values.ts` exists
only because `Transform` lives next door. Once `Transform` moves to a primitive
location, that file collapses back into `apps/web/src/animation/values.ts`
alongside the other resolve-at-time helpers — there's no remaining reason to
split them.

When moving a primitive, look at what *else* in its current folder only exists
because of that primitive. Those usually want to move too (or merge somewhere
else once the anchor is gone).