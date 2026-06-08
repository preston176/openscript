# Effects & GPU Renderer

## How to add a new effect

1. Create a new file in `apps/web/src/lib/effects/definitions/` (e.g. `brightness.ts`)
2. Export an `EffectDefinition` — see `blur.ts` as a reference
3. Register it in `apps/web/src/lib/effects/definitions/index.ts`

An effect definition has:
- `type` — unique string identifier
- `name` — display name
- `keywords` — for search
- `params` — user-facing controls (sliders, toggles, etc.)
- `renderer` — GPU pass templates resolved into shader identifiers + uniforms

All effects use the shared GPU renderer. TypeScript decides which shader identifiers to run and which uniforms to pass. Rust/wgpu owns device creation, textures, and pass execution.

## Single-pass vs multi-pass

The renderer supports a `passes` array. Single-pass effects (e.g. color grading) just have one entry. Multi-pass is needed when an effect has to process its own output — blur (H then V), bloom (extract → blur → composite), glow, etc.

```typescript
renderer: {
  passes: [
    { shader: "my-effect-shader", uniforms: ({ effectParams }) => ({ ... }) },
  ],
}
```

### Dynamic pass counts with `buildPasses`

Some effects need a variable number of passes depending on their parameters (e.g. blur needs more iterations at high intensity to keep quality). For these, add a `buildPasses` function to the renderer:

```typescript
renderer: {
  passes: [ /* static fallback — used if buildPasses is absent */ ],
  buildPasses: ({ effectParams, width, height }) => {
    // return EffectPass[] with pre-computed uniforms
  },
}
```

When `buildPasses` is present, all rendering paths use it instead of the static `passes` array. The static array is kept as a structural reference and fallback for effects that don't need dynamic pass counts.

### Resolving passes — always use `resolveEffectPasses`

All code that consumes effect passes should go through the helper, never access `definition.renderer.passes` directly:

```typescript
import { resolveEffectPasses } from "@/lib/effects";

const passes = resolveEffectPasses({ definition, effectParams, width, height });
```

This handles the `buildPasses` vs static `passes` dispatch automatically.

### Pipeline

Linear effect chains go through `gpuRenderer.applyEffect()` in `apps/web/src/services/renderer/gpu-renderer.ts`.

TypeScript resolves `EffectPass[]` from effect definitions. Each pass contains:
- `shader` — a stable identifier such as `"gaussian-blur"`
- `uniforms` — resolved numeric values for that pass

Rust maps the shader identifier to a precompiled WGSL pipeline in `rust/crates/gpu/src/shader_registry.rs`. Non-linear GPU work such as signed-distance-field generation and mask feathering lives in dedicated Rust pipeline modules, not in TypeScript orchestration.

## Writing shaders

Effect-specific WGSL shaders live in `rust/crates/gpu/src/shaders/`. Add the shader file there, then register its identifier in `rust/crates/gpu/src/shader_registry.rs`.

Available uniforms (automatically injected, no need to pass them manually):
- `u_texture` — the input texture (sampler2D)
- `u_resolution` — canvas size in pixels (vec2)

Any additional uniforms come from the `uniforms()` function in the pass definition.

**Sampling density and step scaling**

A fixed kernel (e.g. ±30 samples) can only cover ±30 texels at step=1. When the target sigma grows beyond ~10, the kernel can't cover enough of the Gaussian curve and the result degrades into a box filter.

The fix is a `u_step` uniform that spaces samples further apart. With step=4 the same 61-sample kernel covers ±120 texels. Bilinear texture filtering smooths the gaps between samples. For very large sigma, combine step scaling with **multi-iteration stacking** (multiple H+V pass pairs via `buildPasses`) — each iteration compounds the blur, and the effective sigma = per-pass sigma × √iterations.

Keep the step size moderate (≤4) to avoid visible banding. If you need more blur than step=4 allows in a single iteration, add iterations instead of increasing the step further.

```wgsl
// u_step scales the distance between samples
let position = f32(sample_index) * uniforms.step;
let weight = exp(-(position * position) / (2.0 * uniforms.sigma * uniforms.sigma));
color += textureSample(input_texture, input_sampler, uv + texel_size * uniforms.direction * position) * weight;
```

Do **not** use large step sizes (>6) in a single pass — it creates visible banding regardless of bilinear interpolation. Use multiple iterations instead.

## Coordinate systems

Source canvases are imported through `copy_external_image_to_texture()`, which is the boundary where browser canvas data enters the GPU pipeline. If a shader or import path changes, validate orientation explicitly — the renderer assumes a consistent top-left canvas origin by the time results come back to TypeScript.
