import { debounce, Debouncer, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NoteTypePluginSettings,
	NoteTypeSettingTab,
} from "./settings";
import {
	patchMetadataEditor,
	reloadMetadataEditor,
} from "./patchMetadataEditor";
import { DEFAULT_FORMATTER_KEY, Formatter, initFormatters } from "./formatter";
import { NoteTypeManager } from "./noteTypeManager";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	styleEl?: HTMLStyleElement;

	saveSettings!: Debouncer<[], Promise<void>>;

	formatters!: Formatter[];

	manager!: NoteTypeManager;

	async onload() {
		await this.loadSettings();
		this.saveSettings = debounce(this._saveSettings, 300);
		this.formatters = initFormatters(this);

		this.manager = new NoteTypeManager(this);

		this.addSettingTab(new NoteTypeSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			patchMetadataEditor(this);

			this.registerEvent(
				this.app.workspace.on(
					"file-open",
					this.addNoteTypeProperty.bind(this),
				),
			);
		});

		console.log("Note Type plugin version:", this.manifest.version);
	}

	onunload() {
		this.styleEl?.remove();
	}

	async addNoteTypeProperty(file: TFile | null) {
		if (!this.settings.enableDefaultNoteType) {
			return;
		}

		if (file == null || file.extension !== "md") {
			return;
		}

		// XXX: waiting other plugin processed when the file is created
		await new Promise<void>((reslove) => setTimeout(() => reslove(), 50));

		const cache = this.app.metadataCache.getFileCache(file);
		if (cache?.frontmatter?.[this.settings.propertyKey] != null) {
			return;
		}

		if (this.settings.emptyNoteOnly && file.stat.size > 0) {
			return;
		}

		this.app.fileManager.processFrontMatter(
			file,
			(frontmatter: Record<string, unknown>) => {
				frontmatter[this.settings.propertyKey] =
					this.settings.defaultNoteType;
			},
		);
	}

	getFormatter(key?: string) {
		key ??= DEFAULT_FORMATTER_KEY;
		return (
			this.formatters.find((f) => f.key === key) ??
			this.formatters.find((f) => f.key === DEFAULT_FORMATTER_KEY)!
		);
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

		if (this.settings.hideProperty) {
			const escapedKey = CSS.escape(
				this.settings.propertyKey,
			).toLowerCase();
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
