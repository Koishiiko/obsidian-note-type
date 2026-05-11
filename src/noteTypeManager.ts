import { CachedMetadata, normalizePath, stringifyYaml, TFile } from "obsidian";
import NoteTypePlugin from "./main";
import { NoteTypeData } from "./settings";
import { FormatData } from "./formatter";
import {
	ContentOverwriteType,
	defaultOverwriteTypeData,
	OverwriteTypeData,
	PropertyOverwriteType,
	showOverwriteConfirmModal,
} from "./components/overwriteConfirmModal";

export class NoteTypeManager {
	constructor(private plugin: NoteTypePlugin) {}

	async onNoteTypeChange(
		key: string,
		note?: TFile | null,
	): Promise<void | true> {
		if (note == null) {
			note = this.plugin.app.workspace.getActiveFile();
			if (note == null) {
				return;
			}
		}

		const noteCache = this.plugin.app.metadataCache.getFileCache(note);
		const noteFrontmatter = noteCache?.frontmatter as
			| Record<string, any>
			| undefined;

		const oldKey = noteFrontmatter?.[this.plugin.settings.propertyKey];
		if (oldKey === key) {
			return;
		}

		if (await this.hasExistingContent(note, noteCache)) {
			const overwriteType = await showOverwriteConfirmModal(
				this.plugin.app,
			);
			if (overwriteType == null) {
				return true;
			}
			await this.applyNoteType(
				note,
				key,
				noteCache,
				noteFrontmatter,
				overwriteType,
			);
		} else {
			await this.applyNoteType(
				note,
				key,
				noteCache,
				noteFrontmatter,
				defaultOverwriteTypeData(),
			);
		}
	}

	async formatTemplate(
		note: TFile,
		noteType?: NoteTypeData,
	): Promise<FormatData> {
		if (noteType?.template == null) {
			return {};
		}

		const templatePath = normalizePath(noteType.template);
		const template = this.plugin.app.vault.getFileByPath(templatePath);
		if (template == null) {
			return {};
		}

		const formatter = this.plugin.getFormatter(noteType.formatter);

		return await formatter!.formatTemplate(note, template, {});
	}

	private async hasExistingContent(
		note: TFile,
		noteCache: CachedMetadata | null,
	): Promise<boolean> {
		const noteFrontmatter = noteCache?.frontmatter as
			| Record<string, any>
			| undefined;
		const haveFrontmatter =
			noteFrontmatter != null &&
			Object.keys(noteFrontmatter).some(
				(k) => k !== this.plugin.settings.propertyKey,
			);

		if (haveFrontmatter) {
			return true;
		}

		const noteContent = await this.plugin.app.vault.cachedRead(note);
		const contentStart = noteCache?.frontmatterPosition?.end.offset ?? 0;
		return noteContent.length > contentStart;
	}

	private async applyNoteType(
		note: TFile,
		key: string,
		noteCache: CachedMetadata | null,
		noteFrontmatter: Record<string, any> | undefined,
		overwriteType: OverwriteTypeData,
	): Promise<void> {
		const noteType = this.plugin.settings.types.find((t) => t.key === key);
		let templateData;
		try {
			templateData = await this.formatTemplate(note, noteType);
		} catch (e) {
			new Notice(`Failed to format template: ${e}`);
			console.error(e);
			return;
		}

		const frontmatter = this.mergeFrontmatter(
			noteFrontmatter,
			templateData.frontmatter,
			overwriteType.frontmatter,
			key,
		);

		this.plugin.app.vault.process(note, (noteContent) => {
			const haveFrontmatter =
				noteFrontmatter != null &&
				Object.keys(noteFrontmatter).some(
					(k) => k !== this.plugin.settings.propertyKey,
				);

			const content = this.mergeContent(
				noteContent,
				noteCache,
				haveFrontmatter,
				templateData.content,
				overwriteType.content,
			);

			return `---\n${stringifyYaml(frontmatter)}---\n${content}`;
		});
	}

	private mergeFrontmatter(
		noteFrontmatter: Record<string, any> | undefined,
		templateFrontmatter: Record<string, unknown> | undefined,
		mode: PropertyOverwriteType,
		noteTypeKey: string,
	): Record<string, unknown> {
		let merged: Record<string, unknown>;

		if (mode === "replace") {
			merged =
				templateFrontmatter == null
					? {}
					: structuredClone(templateFrontmatter);
		} else {
			merged =
				noteFrontmatter == null ? {} : structuredClone(noteFrontmatter);

			if (templateFrontmatter) {
				for (const [k, v] of Object.entries(templateFrontmatter)) {
					if (mode === "overwrite") {
						merged[k] = v;
					} else if (mode === "keep" && merged[k] == null) {
						merged[k] = v;
					}
				}
			}
		}

		merged[this.plugin.settings.propertyKey] = noteTypeKey;
		return merged;
	}

	private mergeContent(
		noteContent: string,
		noteCache: CachedMetadata | null,
		haveFrontmatter: boolean,
		templateContent: string | undefined,
		mode: ContentOverwriteType,
	): string {
		if (mode === "replace") {
			return templateContent ?? "";
		}

		return haveFrontmatter
			? noteContent.substring(noteCache!.frontmatterPosition!.end.offset)
			: noteContent;
	}
}
