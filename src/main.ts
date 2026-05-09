import { MarkdownView, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NoteTypePluginSettings,
	NoteTypeSettingTab,
} from "./settings";
import { patchMetadataEditor } from "./patchMetadataEditor";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new NoteTypeSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			patchMetadataEditor(this);
		});

		console.log("Note Type plugin version:", this.manifest.version);
	}

	onunload() {}

	onNoteTypeChange(key: string, note?: TFile | null) {
		if (key == null || key === "") {
			return;
		}

		if (note == null) {
			note = this.app.workspace.activeEditor?.file;
			if (note == null) {
				return;
			}
		}

		const noteType = this.settings.types.find((t) => t.key === key);
		console.log(noteType);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<NoteTypePluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
