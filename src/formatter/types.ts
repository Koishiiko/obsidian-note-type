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
		options: FormatOptions,
	): Promise<FormatData>;
}

export type FormatVariable = unknown;

export interface FormatOptions {
	// Reserve for future options
	__placeholder?: never;
}

export interface FormatData {
	frontmatter?: Record<string, unknown>;
	content?: string;
}
