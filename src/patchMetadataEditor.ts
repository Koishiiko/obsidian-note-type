import { around, dedupe } from "monkey-around";
import { MetadataEditor } from "obsidian-typings";
import NoteTypePlugin from "./main";
import { IconDropdown } from "./components/iconDropdown";

const MONKEY_AROUND_KEY = "note-type-monkey-around-key";

export const NO_TYPE_KEY = "";

// https://github.com/unxok/obsidian-better-properties/blob/main/src/MetadataEditor/patchMetadataEditor/index.ts
export function patchMetadataEditor(plugin: NoteTypePlugin) {
	const editorPrototype = resolveMetadataEditorPrototype(
		plugin,
	) as PatchedMetadataEditor;

	const removePatch = around(editorPrototype, {
		onload(old) {
			return dedupe(MONKEY_AROUND_KEY, old, function () {
				// @ts-expect-error
				const that = this as PatchedMetadataEditor;
				old.call(that);
				createNoteTypeSelectorEl(plugin, that);
				addClass(plugin, that);
			});
		},
		synchronize(old) {
			return dedupe(MONKEY_AROUND_KEY, old, function (data) {
				// @ts-expect-error
				const that = this as PatchedMetadataEditor;
				old.call(that, data);
				hideNoteTypeProperty(plugin, that);
				updateSelector(plugin, that, data);
			});
		},
		onunload(old) {
			return dedupe(MONKEY_AROUND_KEY, old, function () {
				// @ts-expect-error
				const that = this as PatchedMetadataEditor;
				old.call(that);
				that.noteTypeDropdown?.destroy();
			});
		},
	});

	reloadMetadataEditor(plugin);

	plugin.register(removePatch);
}

export function reloadMetadataEditor(plugin: NoteTypePlugin) {
	plugin.app.workspace.iterateAllLeaves((leaf) => {
		if ("metadataEditor" in leaf.view) {
			void leaf.rebuildView();
		}
	});
}

export function setNoteType(editor: MetadataEditor, key: string) {
	(editor as PatchedMetadataEditor).noteTypeDropdown!.setValue(key);
}

function resolveMetadataEditorPrototype(plugin: NoteTypePlugin) {
	const { workspace, viewRegistry } = plugin.app;
	const leaf = workspace.getLeaf("tab");
	const view = viewRegistry.viewByType["markdown"](leaf);
	const editorPrototype = Object.getPrototypeOf(
		view.metadataEditor,
	) as MetadataEditor;
	leaf.detach();
	return editorPrototype;
}

interface PatchedMetadataEditor extends MetadataEditor {
	noteTypeSelectorContainer?: HTMLElement;
	noteTypeDropdown?: IconDropdown;
}

function createNoteTypeSelectorEl(
	plugin: NoteTypePlugin,
	editor: PatchedMetadataEditor,
) {
	if (editor.noteTypeSelectorContainer != null) {
		editor.noteTypeDropdown?.destroy();
		editor.noteTypeSelectorContainer.remove();
	}

	editor.noteTypeSelectorContainer = createDiv({
		cls: "note-type-selector-container",
	});

	editor.noteTypeDropdown = initNoteTypeSelector(plugin, editor);

	editor.contentEl.prepend(editor.noteTypeSelectorContainer);

	return editor;
}

function initNoteTypeSelector(
	plugin: NoteTypePlugin,
	editor: PatchedMetadataEditor,
) {
	const dropdown = new IconDropdown(editor.noteTypeSelectorContainer!);

	dropdown.onChange((key) => {
		void (async () => {
			const oldType = (editor.properties.find(
				(p) => p.key === plugin.settings.propertyKey,
			)?.value ?? NO_TYPE_KEY) as string;

			if (oldType === key) {
				return;
			}

			const canceled = await plugin.manager.onNoteTypeChange(key);
			if (canceled) {
				dropdown.setValue(oldType);
			}
		})();
	});

	const options = [
		{ key: NO_TYPE_KEY, name: "None" },
		...plugin.settings.types.filter((t) => !t.disabled),
	];

	dropdown.addOptions(options);

	return dropdown;
}

function addClass(_plugin: NoteTypePlugin, editor: PatchedMetadataEditor) {
	editor.containerEl.addClass("note-type-metadata-container");
}

function updateSelector(
	plugin: NoteTypePlugin,
	editor: PatchedMetadataEditor,
	data?: Record<string, unknown>,
) {
	if (data == null || editor.noteTypeDropdown == null) {
		return;
	}

	let value = data[plugin.settings.propertyKey] as string;
	if (editor.noteTypeDropdown.getValue() === value) {
		return;
	}

	if (!plugin.settings.types.some((t) => t.key === value)) {
		value = NO_TYPE_KEY;
	}

	editor.noteTypeDropdown.setValue(value);
}

function hideNoteTypeProperty(
	plugin: NoteTypePlugin,
	editor: PatchedMetadataEditor,
) {
	if (!plugin.settings.hideProperty) {
		return;
	}
	const escapedKey = CSS.escape(plugin.settings.propertyKey).toLowerCase();
	const noteTypeEl = editor.propertyListEl.querySelector(
		`.metadata-property[data-property-key="${escapedKey}"]`,
	);

	if (noteTypeEl != null) {
		noteTypeEl.addClass("note-type-property");
	}
}
