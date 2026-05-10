import { debounce, Debouncer, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NoteTypePluginSettings,
	NoteTypeSettingTab,
} from "./settings";
import {
	patchMetadataEditor,
	reloadMetadataEditor,
} from "./patchMetadataEditor";
import { Formatter } from "./formatter";
import { DefaultFormatter } from "./formatter/defaultFormatter";
import { NoteTypeManager } from "./noteTypeManager";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	styleEl?: HTMLStyleElement;

	saveSettings!: Debouncer<[], Promise<void>>;

	formatters: Formatter[] = [new DefaultFormatter(this)];

	manager!: NoteTypeManager;

	async onload() {
		await this.loadSettings();
		this.saveSettings = debounce(this._saveSettings, 300);

		this.manager = new NoteTypeManager(this);

		this.addSettingTab(new NoteTypeSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			patchMetadataEditor(this);
		});

		console.log("Note Type plugin version:", this.manifest.version);
	}

	onunload() {
		this.styleEl?.remove();
	}

	registerFormatter(formatter: Formatter): void {
		const index = this.formatters.findIndex((f) => f.key === formatter.key);
		if (index >= 0) {
			this.formatters[index] = formatter;
		} else {
			this.formatters.push(formatter);
		}
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
		const styles: string[] = [];

		if (this.settings.alwaysShowProperties) {
			styles.push(
				`.metadata-container.note-type-metadata-container[data-property-count="0"] { display: block; }`,
			);
		}

		if (this.settings.hideProperty) {
			const escapedKey = CSS.escape(this.settings.propertyKey);
			styles.push(
				`.metadata-property[data-property-key="${escapedKey}"] { display: none; }`,
			);
		}

		if (styles.length > 0) {
			if (!this.styleEl) {
				this.styleEl = document.head.createEl("style");
			}
			this.styleEl.textContent = styles.join("\n");
		} else {
			this.styleEl?.remove();
			this.styleEl = undefined;
		}
	}
}
