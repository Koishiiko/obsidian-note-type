import { App, Modal, Setting } from "obsidian";

export type PropertyOverwriteType = "keep" | "replace" | "overwrite";
export type ContentOverwriteType = "keep" | "replace";

export interface OverwriteTypeData {
	frontmatter: PropertyOverwriteType;
	content: ContentOverwriteType;
}

export function defaultOverwriteTypeData(): OverwriteTypeData {
	return {
		frontmatter: "overwrite",
		content: "replace",
	};
}

export function showOverwriteConfirmModal(app: App) {
	return new Promise<OverwriteTypeData | null>((resolve) => {
		new OverwriteConfirmModal(app, (type) => resolve(type)).open();
	});
}

export class OverwriteConfirmModal extends Modal {
	data: OverwriteTypeData = defaultOverwriteTypeData();
	isConfirm = false;
	constructor(
		app: App,
		public callback: (type: OverwriteTypeData | null) => void,
	) {
		super(app);
	}

	onOpen() {
		this.setTitle("Note already have content");

		new Setting(this.contentEl)
			.setName("Property behavior")
			.addDropdown((d) => {
				d.setValue(this.data.frontmatter);
				d.addOptions({
					keep: "Fill by template if not exists",
					replace: "Replace by template",
					overwrite: "Overwrite current if already exists",
				});
				d.onChange(
					(value) =>
						(this.data.frontmatter =
							value as PropertyOverwriteType),
				);
			});

		new Setting(this.contentEl)
			.setName("Content behavior")
			.addDropdown((d) => {
				d.setValue(this.data.content);
				d.addOptions({
					replace: "Replace current by template",
					keep: "Keep current",
				});
				d.onChange(
					(value) =>
						(this.data.content = value as ContentOverwriteType),
				);
			});

		new Setting(this.contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.isConfirm = false;
					this.close();
				}),
			)
			.addButton((btn) =>
				btn
					.setButtonText("Confirm")
					.setCta()
					.onClick(async () => {
						this.isConfirm = true;
						this.close();
					}),
			);
	}

	onClose(): void {
		if (this.isConfirm) {
			this.callback(this.data);
		} else {
			this.callback(null);
		}
	}
}
