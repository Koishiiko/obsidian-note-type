import { Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NoteTypePluginSettings,
	NoteTypeSettingTab,
} from "./settings";
import {
	NOTE_TYPE_WIDGET_TYPE,
	NoteTypeWidget,
} from "./components/noteTypeWidget";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new NoteTypeSettingTab(this.app, this));

		this.registerNoteType();

		console.log("Note Type plugin version:", this.manifest.version);
	}

	registerNoteType() {
		this.app.metadataTypeManager.registeredTypeWidgets[
			NOTE_TYPE_WIDGET_TYPE
		] = new NoteTypeWidget(this);

		if (this.settings.key) {
			this.app.metadataTypeManager.setType(
				this.settings.key,
				NOTE_TYPE_WIDGET_TYPE,
			);
		}
	}

	unregisterNoteType() {
		delete this.app.metadataTypeManager.registeredTypeWidgets[
			NOTE_TYPE_WIDGET_TYPE
		];
	}

	onunload() {
		this.unregisterNoteType();
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
