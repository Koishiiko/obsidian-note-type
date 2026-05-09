import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, NoteTypePluginSettings } from "./settings";
import { NOTE_TYPE_WIDGET_TYPE, NoteTypeWidget } from "./note-type-widget";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerNoteType();

		console.log("Note Type plugin version:", this.manifest.version);
	}

	registerNoteType() {
		this.app.metadataTypeManager.registeredTypeWidgets[
			NOTE_TYPE_WIDGET_TYPE
		] = new NoteTypeWidget(this);

		if (this.settings.keys?.length) {
			this.settings.keys.forEach((key) =>
				this.app.metadataTypeManager.setType(
					key,
					NOTE_TYPE_WIDGET_TYPE,
				),
			);
		}

		this.app.metadataTypeManager.save();

		console.log(this.app.metadataTypeManager);
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
