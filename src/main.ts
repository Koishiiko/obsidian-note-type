import { debounce, Debouncer, normalizePath, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NoteTypeData,
	NoteTypePluginSettings,
	NoteTypeSettingTab,
} from "./settings";
import {
	patchMetadataEditor,
	reloadMetadataEditor,
} from "./patchMetadataEditor";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	styleEl?: HTMLStyleElement;

	saveSettings!: Debouncer<[], Promise<void>>;

	async onload() {
		await this.loadSettings();
		this.saveSettings = debounce(this._saveSettings, 300);

		this.addSettingTab(new NoteTypeSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			patchMetadataEditor(this);
		});

		console.log("Note Type plugin version:", this.manifest.version);
	}

	onunload() {
		this.styleEl!.remove();
	}

	async onNoteTypeChange(key: string, note?: TFile | null) {
		if (note == null) {
			note = this.app.workspace.getActiveFile();
			if (note == null) {
				return;
			}
		}

		if (key == null || key === "") {
			this.app.fileManager.processFrontMatter(
				note,
				(frontmatter: Record<string, unknown>) => {
					frontmatter[this.settings!.propertyKey] = key;
				},
			);
			return;
		}

		const noteType = this.settings!.types.find((t) => t.key === key);
		if (noteType == null) {
			new Notice(`Note type not found: ${key}`);
			return;
		}

		const templateData = await this.formatTemplate(noteType);
		this.app.fileManager.processFrontMatter(
			note,
			(frontmatter: Record<string, unknown>) => {
				frontmatter[this.settings!.propertyKey] = key;

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
		this.updateStyle();
	}

	async _saveSettings() {
		await this.saveData(this.settings);

		this.updateStyle();
		reloadMetadataEditor(this);
	}

	updateStyle() {
		if (this.styleEl == null) {
			this.styleEl = document.head.createEl("style");
		}

		const styles = [];
		if (this.settings.alwaysShowProperties) {
			styles.push(`.markdown-source-view.is-live-preview.show-properties
	.metadata-container.note-type-metadata-container[data-property-count="0"] {
	display: block;
}`);
		}

		if (this.settings.hideProperty) {
			styles.push(`.metadata-properties .metadata-property[data-property-key="${this.settings.propertyKey.toLocaleLowerCase()}"] {
    display: none;
}`);
		}

		this.styleEl.textContent = styles.join("\n");
	}
}
