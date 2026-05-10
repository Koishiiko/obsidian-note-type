import { Modal, PaneType, Setting, SettingGroup } from "obsidian";
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

const DEFUALT_NOTE_TYPE: NoteTypeData = {
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
		this.props.data ??= structuredClone(DEFUALT_NOTE_TYPE);
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
		}
	}

	base() {
		let { data } = this.props;
		data = data!;
		const group = new SettingGroup(this.contentEl);

		group.addSetting((s) =>
			s
				.setName("Key")
				.addText((t) =>
					t
						.setValue(data.key)
						.onChange((value) => (data.key = value)),
				),
		);

		group.addSetting((s) =>
			s
				.setName("Name")
				.addText((t) =>
					t
						.setValue(data.name)
						.onChange((value) => (data.name = value)),
				),
		);

		group.addSetting((s) =>
			s.setName("Template").addText((t) => {
				t.setValue(data.template ?? "").onChange(
					(value) => (data.template = value),
				);
				new FileSuggester(this.app, t.inputEl, { type: "files" });
			}),
		);

		group.addSetting((s) =>
			s.setName("Formatter").addDropdown((d) => {
				d.setValue(data.formatter ?? DEFAULT_FORMATTER_KEY)
					.addOptions(
						this.plugin.formatters.reduce(
							(res, type) => {
								res[type.key] = type.name;
								return res;
							},
							{} as Record<string, string>,
						),
					)
					.onChange((value) => (data.formatter = value));
			}),
		);
	}
}
