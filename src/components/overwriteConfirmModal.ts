import { App, Modal, Setting } from "obsidian";
import { RadioGroupComponent } from "./radioGroup";

export type PropertyOverwriteType = "keep" | "replace" | "overwrite";
export type ContentOverwriteType = "keep" | "replace";

export const propertyOverwriteTypes = {
	overwrite: "Overwrite",
	keep: "Keep current",
	replace: "Replace",
};
export const contentOverwriteTypes = {
	replace: "Replace",
	keep: "Keep current",
};

export interface OverwriteTypeData {
	frontmatter: PropertyOverwriteType;
	content: ContentOverwriteType;
}

export function showOverwriteConfirmModal(
	app: App,
	overwriteType: OverwriteTypeData,
) {
	return new Promise<OverwriteTypeData | null>((resolve) => {
		new OverwriteConfirmModal(app, overwriteType, (type) =>
			resolve(type),
		).open();
	});
}

export class OverwriteConfirmModal extends Modal {
	data: OverwriteTypeData;
	isConfirm = false;
	constructor(
		app: App,
		data: OverwriteTypeData,
		public callback: (type: OverwriteTypeData | null) => void,
	) {
		super(app);
		this.data = data;
	}

	onOpen() {
		this.setTitle("Note already have content");
		this.modalEl.addClass("overwrite-confirm-modal");

		const propertySetting = new Setting(this.contentEl)
			.setName("Property behavior")
			.setDesc("How the template's properties are applied.");

		new RadioGroupComponent(propertySetting.controlEl, "property")
			.addOptions(propertyOverwriteTypes)
			.setValue(this.data.frontmatter)
			.onChange((value) => {
				this.data.frontmatter = value as PropertyOverwriteType;
			})
			.build();

		const contentSetting = new Setting(this.contentEl)
			.setName("Content behavior")
			.setDesc("How the template's content are filled.");

		new RadioGroupComponent(contentSetting.controlEl, "content")
			.addOptions(contentOverwriteTypes)
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
