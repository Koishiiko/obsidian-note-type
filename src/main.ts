import { Plugin, type App } from "obsidian";
import { DEFAULT_SETTINGS, NoteTypePluginSettings } from "./settings";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	async onload() {
		await this.loadSettings();

		console.log("Note Type plugin version:", this.manifest.version);
	}

	onunload() {}

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
