import { normalizePath, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NoteTypeData,
	NoteTypePluginSettings,
	NoteTypeSettingTab,
} from "./settings";
import { patchMetadataEditor } from "./patchMetadataEditor";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	styleEl?: HTMLStyleElement;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new NoteTypeSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			patchMetadataEditor(this);
		});

		console.log("Note Type plugin version:", this.manifest.version);
	}

	onunload() {}

	async onNoteTypeChange(key: string, note?: TFile | null) {
		if (key == null || key === "") {
			return;
		}

		if (note == null) {
			note = this.app.workspace.getActiveFile();
			if (note == null) {
				return;
			}
		}

		const noteType = this.settings.types.find((t) => t.key === key);
		if (noteType == null) {
			new Notice(`Note type not found: ${key}`);
			return;
		}

		const templateData = await this.formatTemplate(noteType);
		this.app.fileManager.processFrontMatter(
			note,
			(frontmatter: Record<string, unknown>) => {
				frontmatter[this.settings.propertyKey] = key;

				for (const [key, value] of Object.entries(
					templateData.frontmatter as Record<string, unknown>,
				)) {
					frontmatter[key] = value;
				}
			},
		);
	}

	async formatTemplate(noteType: NoteTypeData) {
		if (noteType.template == null) {
			return {};
		}

		const templatePath = normalizePath(noteType.template);
		const file = this.app.vault.getFileByPath(templatePath);
		if (file == null) {
			return {};
		}

		const cache = this.app.metadataCache.getFileCache(file);
		return {
			frontmatter: cache?.frontmatter,
		};
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
