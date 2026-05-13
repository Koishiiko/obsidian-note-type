import { AbstractInputSuggest, App, TAbstractFile } from "obsidian";

export class FileSuggester extends AbstractInputSuggest<TAbstractFile> {
	el: HTMLInputElement;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		private options: {
			type?: "all" | "folders" | "files";
			files?: TAbstractFile[];
			suggestionsCallback?: (
				file: TAbstractFile,
				query: string,
			) => boolean;
		},
	) {
		super(app, inputEl);
		this.el = inputEl;

		if (options.files == null) {
			if (options.type === "folders") {
				options.files = app.vault.getAllFolders();
			} else if (options.type === "files") {
				options.files = app.vault.getFiles();
			} else {
				options.files = app.vault.getAllLoadedFiles();
			}
		}

		if (options.suggestionsCallback == null) {
			options.suggestionsCallback = (file, query) =>
				query == null ||
				query.trim() === "" ||
				file.path.contains(query);
		}
	}

	protected getSuggestions(
		query: string,
	): TAbstractFile[] | Promise<TAbstractFile[]> {
		return this.options.files!.filter((f) =>
			this.options.suggestionsCallback!(f, query),
		);
	}

	renderSuggestion(value: TAbstractFile, el: HTMLElement): void {
		el.createSpan({ text: value.path });
	}

	override selectSuggestion(value: TAbstractFile): void {
		this.el.value = value.path;
		this.el.trigger("input");
		this.close();
	}
}
