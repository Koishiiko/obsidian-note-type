import { Modal, Setting, SettingGroup } from "obsidian";
import { NoteTypeData } from "../settings";
import NoteTypePlugin from "../main";
import { FileSuggester } from "./fileSuggester";
import { DEFAULT_FORMATTER_KEY } from "../formatter";

export interface NoteTypeModalProps {
	title: string;

	data?: NoteTypeData;

	onSubmit?: (template: NoteTypeData) => boolean;

	onCancel?: () => void;
}

const DEFAULT_NOTE_TYPE: NoteTypeData = {
	key: "new-type",
	name: "New type",
};

export class NoteTypeModal extends Modal {
	plugin: NoteTypePlugin;

	props: NoteTypeModalProps;

	isConfirmed: boolean = false;

	constructor(plugin: NoteTypePlugin, props: NoteTypeModalProps) {
		super(plugin.app);
		this.plugin = plugin;
		this.props = props;
		this.props.data ??= structuredClone(DEFAULT_NOTE_TYPE);
	}

	onOpen(): Promise<void> | void {
		this.setTitle(this.props.title);
		this.contentEl.empty();

		this.base();

		new Setting(this.contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				}),
			)
			.addButton((btn) =>
				btn
					.setButtonText("Confirm")
					.setCta()
					.onClick(async () => {
						if (this.props.onSubmit) {
							const result = this.props.onSubmit(
								this.props.data!,
							);
							if (result) {
								this.isConfirmed = true;
								this.close();
							}
						}
					}),
			);
	}

	onClose(): void {
		if (!this.isConfirmed && this.props.onCancel != null) {
			this.props.onCancel();
		} else if (this.props.onSubmit != null) {
			this.props.onSubmit(this.props.data!);
		}
	}

	base() {
		let { data } = this.props;
		data = data!;
		const group = new SettingGroup(this.contentEl);

		group.addSetting((s) =>
			s
				.setName("Key")
				.setDesc(
					"Unique identifier for this note type, it will be set to the property key.",
				)
				.addText((t) =>
					t
						.setValue(data.key)
						.onChange((value) => (data.key = value)),
				),
		);

		group.addSetting((s) =>
			s
				.setName("Name")
				.setDesc("Display name of the note type.")
				.addText((t) =>
					t
						.setValue(data.name)
						.onChange((value) => (data.name = value)),
				),
		);

		group.addSetting((s) =>
			s
				.setName("Template")
				.setDesc(
					"Template file to use when filling a note of this type.",
				)
				.addText((t) => {
					t.setValue(data.template ?? "").onChange(
						(value) => (data.template = value),
					);
					new FileSuggester(this.app, t.inputEl, { type: "files" });
				}),
		);

		group.addSetting((s) =>
			s
				.setName("Formatter")
				.setDesc("Template formatter.")
				.addDropdown((d) => {
					d.addOptions(
						this.plugin.formatters.reduce(
							(res, type) => {
								res[type.key] = type.name;
								return res;
							},
							{} as Record<string, string>,
						),
					)
						.setValue(data.formatter ?? DEFAULT_FORMATTER_KEY)
						.onChange((value) => (data.formatter = value));
				}),
		);
	}
}
