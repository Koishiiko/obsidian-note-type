import { App, Modal, Setting } from "obsidian";
import { RadioGroupComponent } from "./RadioGroup";

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
		this.modalEl.addClass("overwrite-confirm-modal");

		const propertySetting = new Setting(this.contentEl)
			.setName("Property behavior")
			.setDesc("How the template's properties are applied.");

		new RadioGroupComponent(propertySetting.controlEl)
			.addOptions({
				overwrite: "Overwrite",
				keep: "Keep current",
				replace: "Replace",
			})
			.setValue(this.data.frontmatter)
			.onChange((value) => {
				this.data.frontmatter = value as PropertyOverwriteType;
			})
			.build();

		const contentSetting = new Setting(this.contentEl)
			.setName("Content behavior")
			.setDesc("How the template's content are filled.");

		new RadioGroupComponent(contentSetting.controlEl)
			.addOptions({
				replace: "Replace",
				keep: "Keep current",
			})
			.setValue(this.data.content)
			.onChange((value) => {
				this.data.content = value as ContentOverwriteType;
			})
			.build();

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
