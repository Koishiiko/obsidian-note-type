import { App, PluginSettingTab } from "obsidian";
import NoteTypePlugin from "./main";

export interface NoteTypePluginSettings {
	propertyIcon: string;
	keys: string[];
}

export const DEFAULT_SETTINGS: NoteTypePluginSettings = {
	propertyIcon: "",
	keys: [],
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: NoteTypePlugin;

	constructor(app: App, plugin: NoteTypePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
	}
}
