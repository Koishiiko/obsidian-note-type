import {
	debounce,
	Debouncer,
	normalizePath,
	Plugin,
	stringifyYaml,
	TFile,
} from "obsidian";
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
import { FormatData, Formatter } from "./formatter";
import { DefaultFormatter } from "./formatter/defaultFormatter";
import { defaultVairables } from "./formatter/utils";
import {
	defaultOverwriteTypeData,
	OverwriteTypeData,
	showOverwriteConfirmModal,
} from "./components/overwriteConfirmModal";

export default class NoteTypePlugin extends Plugin {
	settings!: NoteTypePluginSettings;

	styleEl?: HTMLStyleElement;

	saveSettings!: Debouncer<[], Promise<void>>;

	formatters: Formatter[] = [new DefaultFormatter(this)];

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

	async onNoteTypeChange(
		key: string,
		note?: TFile | null,
	): Promise<void | true> {
		if (note == null) {
			note = this.app.workspace.getActiveFile();
			if (note == null) {
				return;
			}
		}

		const noteCache = this.app.metadataCache.getFileCache(note);
		const noteFrontmatter = noteCache?.frontmatter as Record<string, any>;

		const oldKey = noteFrontmatter?.[this.settings.propertyKey];
		if (oldKey === key) {
			return;
		}

		const haveFrontmatter =
			noteFrontmatter != null &&
			Object.keys(noteFrontmatter).some(
				(key) => key !== this.settings.propertyKey,
			);

		const noteContent = await this.app.vault.cachedRead(note);
		const haveContent =
			noteContent.length >
			(noteCache?.frontmatterPosition?.end.offset ?? 0);

		let overwriteType: OverwriteTypeData = defaultOverwriteTypeData();
		if (haveFrontmatter || haveContent) {
			const type = await showOverwriteConfirmModal(this.app);
			if (type == null) {
				return true;
			}
			overwriteType = type;
		}

		const noteType = this.settings!.types.find((t) => t.key === key);

		const templateData = await this.formatTemplate(note, noteType);

		let frontmatter: Record<string, unknown> | null;
		if (overwriteType.frontmatter === "replace") {
			frontmatter = templateData.frontmatter ?? {};
		} else {
			frontmatter =
				noteFrontmatter == null ? {} : structuredClone(noteFrontmatter);

			for (const [key, value] of Object.entries(
				templateData.frontmatter ?? {},
			)) {
				if (overwriteType.frontmatter === "overwrite") {
					frontmatter[key] = value;
				} else if (
					overwriteType.frontmatter === "keep" &&
					frontmatter[key] == null
				) {
					frontmatter[key] = value;
				}
			}
		}
		frontmatter[this.settings.propertyKey] = key;

		let content: string;
		if (overwriteType.content === "replace") {
			content = templateData.content ?? "";
		} else {
			content = haveFrontmatter
				? noteContent.substring(
						noteCache!.frontmatterPosition!.end.offset,
					)
				: noteContent;
		}

		const writeContent = `---\n${stringifyYaml(frontmatter)}\n---\n${content.trimStart()}`;
		await this.app.vault.modify(note, writeContent);
	}

	async formatTemplate(
		note: TFile,
		noteType?: NoteTypeData,
	): Promise<FormatData> {
		if (noteType?.template == null) {
			return {};
		}

		const templatePath = normalizePath(noteType.template);
		const template = this.app.vault.getFileByPath(templatePath);
		if (template == null) {
			return {};
		}

		const formatter =
			this.formatters.find((f) => f.key === noteType.formatter) ??
			this.formatters[0];

		return await formatter!.formatTemplate(
			note,
			template,
			defaultVairables(note),
			{},
		);
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
