import { around, dedupe } from "monkey-around";
import { MetadataEditor } from "obsidian-typings";
import NoteTypePlugin from "./main";
import { DropdownComponent } from "obsidian";

const MONKEY_AROUND_KEY = "note-type-monkey-around-key";

const NO_TYPE_KEY = "";

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
				updateSelector(plugin, that, data);
			});
		},
	});

	reloadMetadataEditor(plugin);

	plugin.register(removePatch);
}

export function reloadMetadataEditor(plugin: NoteTypePlugin) {
	plugin.app.workspace.iterateAllLeaves((leaf) => {
		if ("metadataEditor" in leaf.view) {
			leaf.rebuildView();
		}
	});
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
	noteTypeDropdown?: DropdownComponent;
}

function createNoteTypeSelectorEl(
	plugin: NoteTypePlugin,
	editor: PatchedMetadataEditor,
) {
	if (editor.noteTypeSelectorContainer != null) {
		editor.noteTypeSelectorContainer.remove();
	}

	editor.noteTypeSelectorContainer = createDiv({
		cls: "note-type-selector-container",
	});

	editor.noteTypeDropdown = initNoteTypeSelector(
		plugin,
		editor.noteTypeSelectorContainer,
	);

	editor.contentEl.prepend(editor.noteTypeSelectorContainer);

	return editor;
}

function initNoteTypeSelector(
	plugin: NoteTypePlugin,
	containerEl: HTMLElement,
) {
	const dropdown = new DropdownComponent(containerEl);

	const items = plugin.settings!.types.reduce(
		(result, current) => {
			result[current.key] = current.name;
			return result;
		},
		{ [NO_TYPE_KEY]: "No type" } as Record<string, string>,
	);

	dropdown.onChange((key) => plugin.onNoteTypeChange(key));

	dropdown.addOptions(items);

	return dropdown;
}

function addClass(plugin: NoteTypePlugin, editor: PatchedMetadataEditor) {
	editor.containerEl.addClass("note-type-metadata-container");
}

function updateSelector(
	plugin: NoteTypePlugin,
	editor: PatchedMetadataEditor,
	data: Record<string, unknown>,
) {
	let value = data[plugin.settings.propertyKey] as string;
	if (editor.noteTypeDropdown?.getValue() === value) {
		return;
	}

	if (!plugin.settings.types.some((t) => t.key === value)) {
		value = NO_TYPE_KEY;
	}

	editor.noteTypeDropdown!.setValue(value as string);
}
