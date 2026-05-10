import { TFile } from "obsidian";
import NoteTypePlugin from "../main";

export abstract class Formatter {
	abstract key: string;
	abstract name: string;

	plugin: NoteTypePlugin;

	constructor(plugin: NoteTypePlugin) {
		this.plugin = plugin;
	}

	abstract formatTemplate(
		note: TFile,
		template: TFile,
		vars: Record<string, FormatVariable>,
		options: FormatOptions,
	): Promise<FormatData>;
}

export type FormatVariable = string | number | moment.Moment | unknown;

export interface FormatOptions {}

export interface FormatData {
	frontmatter?: Record<string, unknown>;
	content?: string;
}
