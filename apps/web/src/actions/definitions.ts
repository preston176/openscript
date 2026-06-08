import type { ShortcutKey } from "@/actions/keybinding";
import type { TActionWithOptionalArgs } from "./types";

export type TActionCategory =
	| "playback"
	| "navigation"
	| "editing"
	| "selection"
	| "history"
	| "timeline"
	| "controls"
	| "assets";

export interface TActionBaseDefinition {
	description: string;
	category: TActionCategory;
	args?: Record<string, unknown>;
}

export interface TActionDefinition extends TActionBaseDefinition {
	defaultShortcuts?: readonly ShortcutKey[];
}

export const ACTIONS = {
	"toggle-play": {
		description: "Play/Pause",
		category: "playback",
	},
	"stop-playback": {
		description: "Stop playback",
		category: "playback",
	},
	"seek-forward": {
		description: "Seek forward 1 second",
		category: "playback",
		args: { seconds: "number" },
	},
	"seek-backward": {
		description: "Seek backward 1 second",
		category: "playback",
		args: { seconds: "number" },
	},
	"frame-step-forward": {
		description: "Frame step forward",
		category: "navigation",
	},
	"frame-step-backward": {
		description: "Frame step backward",
		category: "navigation",
	},
	"jump-forward": {
		description: "Jump forward 5 seconds",
		category: "navigation",
		args: { seconds: "number" },
	},
	"jump-backward": {
		description: "Jump backward 5 seconds",
		category: "navigation",
		args: { seconds: "number" },
	},
	"goto-start": {
		description: "Go to timeline start",
		category: "navigation",
	},
	"goto-end": {
		description: "Go to timeline end",
		category: "navigation",
	},
	split: {
		description: "Split elements at playhead",
		category: "editing",
	},
	"split-left": {
		description: "Split and remove left",
		category: "editing",
	},
	"split-right": {
		description: "Split and remove right",
		category: "editing",
	},
	"delete-selected": {
		description: "Delete current selection",
		category: "editing",
	},
	"copy-selected": {
		description: "Copy selected elements",
		category: "editing",
	},
	"paste-copied": {
		description: "Paste elements at playhead",
		category: "editing",
	},
	"toggle-snapping": {
		description: "Toggle snapping",
		category: "editing",
	},
	"toggle-ripple-editing": {
		description: "Toggle ripple editing",
		category: "editing",
	},
	"toggle-source-audio": {
		description: "Extract or recover source audio",
		category: "editing",
	},
	"select-all": {
		description: "Select all elements",
		category: "selection",
	},
	"cancel-interaction": {
		description: "Cancel current interaction",
		category: "controls",
	},
	"deselect-all": {
		description: "Deselect all elements",
		category: "selection",
	},
	"duplicate-selected": {
		description: "Duplicate selected element",
		category: "selection",
	},
	"toggle-elements-muted-selected": {
		description: "Mute/unmute selected elements",
		category: "selection",
	},
	"toggle-elements-visibility-selected": {
		description: "Show/hide selected elements",
		category: "selection",
	},
	"toggle-bookmark": {
		description: "Toggle bookmark at playhead",
		category: "timeline",
	},
	undo: {
		description: "Undo",
		category: "history",
	},
	redo: {
		description: "Redo",
		category: "history",
	},
	"remove-media-asset": {
		description: "Remove media asset",
		category: "assets",
		args: { projectId: "string", assetId: "string" },
	},
	"remove-media-assets": {
		description: "Remove media assets",
		category: "assets",
		args: { projectId: "string", assetIds: "string[]" },
	},
} as const satisfies Record<string, TActionBaseDefinition>;

export type TAction = keyof typeof ACTIONS;

/** Actions that require arguments and therefore cannot be bound to a bare shortcut. */
type TActionWithRequiredArgs = Exclude<TAction, TActionWithOptionalArgs>;

// Exhaustive by construction: `satisfies Record<TActionWithRequiredArgs, true>`
// makes TypeScript error here if a new required-args action is added to
// `TActionArgsMap`, so the runtime guard can never silently fall out of sync.
const ACTIONS_WITH_REQUIRED_ARGS = {
	"remove-media-asset": true,
	"remove-media-assets": true,
} as const satisfies Record<TActionWithRequiredArgs, true>;

/** Runtime guard: is `value` one of the known action identifiers? */
export function isAction(value: string): value is TAction {
	return Object.hasOwn(ACTIONS, value);
}

/**
 * Runtime guard: is `value` an action that can be bound to a keybinding, i.e.
 * a known action that does not require arguments? Mirrors the
 * `TActionWithOptionalArgs` type exactly.
 */
export function isActionWithOptionalArgs(
	value: string,
): value is TActionWithOptionalArgs {
	return isAction(value) && !Object.hasOwn(ACTIONS_WITH_REQUIRED_ARGS, value);
}

const ACTION_DEFAULT_SHORTCUTS = [
	["toggle-play", ["space", "k"]],
	["seek-forward", ["l"]],
	["seek-backward", ["j"]],
	["frame-step-forward", ["right"]],
	["frame-step-backward", ["left"]],
	["jump-forward", ["shift+right"]],
	["jump-backward", ["shift+left"]],
	["goto-start", ["home", "enter"]],
	["goto-end", ["end"]],
	["split", ["s"]],
	["split-left", ["q"]],
	["split-right", ["w"]],
	["delete-selected", ["backspace", "delete"]],
	["copy-selected", ["ctrl+c"]],
	["paste-copied", ["ctrl+v"]],
	["toggle-snapping", ["n"]],
	["select-all", ["ctrl+a"]],
	["cancel-interaction", ["escape"]],
	["duplicate-selected", ["ctrl+d"]],
	["undo", ["ctrl+z"]],
	["redo", ["ctrl+shift+z", "ctrl+y"]],
] as const satisfies ReadonlyArray<
	readonly [TActionWithOptionalArgs, readonly ShortcutKey[]]
>;

const ACTION_DEFAULT_SHORTCUTS_BY_ACTION = new Map<
	TAction,
	readonly ShortcutKey[]
>(ACTION_DEFAULT_SHORTCUTS);

export function getActionDefinition({
	action,
}: {
	action: TAction;
}): TActionDefinition {
	return {
		...ACTIONS[action],
		defaultShortcuts: ACTION_DEFAULT_SHORTCUTS_BY_ACTION.get(action),
	};
}

export function getDefaultShortcuts(): Map<
	ShortcutKey,
	TActionWithOptionalArgs
> {
	const shortcuts = new Map<ShortcutKey, TActionWithOptionalArgs>();

	for (const [action, defaultShortcuts] of ACTION_DEFAULT_SHORTCUTS) {
		for (const shortcut of defaultShortcuts) {
			shortcuts.set(shortcut, action);
		}
	}

	return shortcuts;
}
