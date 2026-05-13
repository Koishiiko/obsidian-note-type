import { debounce, Debouncer, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	NoteTypePluginSettings,
	NoteTypeSettingTab,
} from "./settings";
import {
	patchMetadataEditor,
	reloadMetadataEditor,
	setNoteType,
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
		this.saveSettings = debounce(this._saveSettings.bind(this), 300);
		this.formatters = initFormatters(this);

		this.manager = new NoteTypeManager(this);

		this.addSettingTab(new NoteTypeSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			patchMetadataEditor(this);

			this.registerEvent(
				this.app.workspace.on(
					"file-open",
					(file) => void this.addNoteTypeProperty(file),
				),
			);
		});
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
		await new Promise<void>((reslove) =>
			window.setTimeout(() => reslove(), 100),
		);

		const cache = this.app.metadataCache.getFileCache(file);
		if (cache?.frontmatter?.[this.settings.propertyKey] != null) {
			return;
		}

		if (this.settings.emptyNoteOnly && file.stat.size > 0) {
			return;
		}

		setNoteType(
			this.app.workspace.activeEditor!.metadataEditor!,
			this.settings.defaultNoteType,
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
	}

	async _saveSettings() {
		await this.saveData(this.settings);

		reloadMetadataEditor(this);
	}
}
