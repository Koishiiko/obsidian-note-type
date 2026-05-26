import {
	App,
	ButtonComponent,
	PluginSettingTab,
	setIcon,
	SettingGroup,
	Notice,
} from "obsidian";
import NoteTypePlugin from "./main";
import { NoteTypeModal } from "./components/noteTypeModal";
import {
	ContentOverwriteType,
	contentOverwriteTypes,
	PropertyOverwriteType,
	propertyOverwriteTypes,
} from "./components/overwriteConfirmModal";
import { NO_TYPE_KEY } from "./patchMetadataEditor";
import { DEFAULT_ICON } from "./components/iconDropdown";

export interface NoteTypePluginSettings {
	propertyKey: string;
	hideProperty: boolean;

	types: NoteTypeData[];

	showConfictModal: boolean;
	defaultPropertyOverwriteType: PropertyOverwriteType;
	defaultContentOverwriteType: ContentOverwriteType;

	enableDefaultNoteType: boolean;
	emptyNoteOnly: boolean;
	defaultNoteType: string;
}

export interface NoteTypeData {
	key: string;
	name: string;
	icon?: string;
	color?: string;
	folder?: string;
	template?: string;
	formatter?: string;
	disabled?: boolean;
}

export const DEFAULT_SETTINGS: NoteTypePluginSettings = {
	propertyKey: "noteType",
	hideProperty: true,

	types: [],

	showConfictModal: true,
	defaultPropertyOverwriteType: "overwrite",
	defaultContentOverwriteType: "replace",

	enableDefaultNoteType: false,
	emptyNoteOnly: true,
	defaultNoteType: NO_TYPE_KEY,
};

export class NoteTypeSettingTab extends PluginSettingTab {
	plugin: NoteTypePlugin;

	constructor(app: App, plugin: NoteTypePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		this.base();
		this.overwrite();
		this.defaultNoteType();
		this.types();
	}

	base() {
		const group = new SettingGroup(this.containerEl);

		group.addSetting((s) => {
			s.setName("Property key")
				.setDesc("Property key used to identify the note type.")
				.addText((text) => {
					text.setValue(this.plugin.settings.propertyKey);
					text.inputEl.tabIndex = -1;
					text.inputEl.addEventListener("blur", () => {
						this.plugin.settings.propertyKey =
							text.inputEl.value.trim();
						void this.plugin.saveSettings();
					});
				});
		});

		group.addSetting((s) => {
			s.setName("Hide note type property")
				.setDesc("Hide the note type property in the property editor.")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.hideProperty)
						.onChange((value) => {
							this.plugin.settings.hideProperty = value;
							void this.plugin.saveSettings();
						}),
				);
		});
	}

	overwrite() {
		const group = new SettingGroup(this.containerEl);
		group.setHeading("Overwrite");

		group.addSetting((s) => {
			s.setName("Show conflict modal")
				.setDesc(
					"Prompt for overwrite options when changing note type.",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.showConfictModal)
						.onChange((value) => {
							this.plugin.settings.showConfictModal = value;
							void this.plugin.saveSettings();
						}),
				);
		});

		group.addSetting((s) => {
			s.setName("Default property behavior")
				.setDesc("How template properties are applied by default.")
				.addDropdown((d) =>
					d
						.addOptions(propertyOverwriteTypes)
						.setValue(
							this.plugin.settings.defaultPropertyOverwriteType,
						)
						.onChange((value) => {
							this.plugin.settings.defaultPropertyOverwriteType =
								value as PropertyOverwriteType;
							void this.plugin.saveSettings();
						}),
				);
		});

		group.addSetting((s) => {
			s.setName("Default content behavior")
				.setDesc("How template content is filled by default.")
				.addDropdown((d) =>
					d
						.addOptions(contentOverwriteTypes)
						.setValue(
							this.plugin.settings.defaultContentOverwriteType,
						)
						.onChange((value) => {
							this.plugin.settings.defaultContentOverwriteType =
								value as ContentOverwriteType;
							void this.plugin.saveSettings();
						}),
				);
		});
	}

	defaultNoteType() {
		const group = new SettingGroup(this.containerEl);
		group.setHeading("Default note type");

		group.addSetting((s) => {
			s.setName("Enable default note type")
				.setDesc(
					"Automatically apply the default note type when a file that does no have note type is opened.",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.enableDefaultNoteType)
						.onChange((value) => {
							this.plugin.settings.enableDefaultNoteType = value;
							void this.plugin.saveSettings();
						}),
				);
		});

		group.addSetting((s) => {
			s.setName("Empty note only")
				.setDesc("Only apply the note type to empty notes.")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.emptyNoteOnly)
						.onChange((value) => {
							this.plugin.settings.emptyNoteOnly = value;
							void this.plugin.saveSettings();
						}),
				);
		});

		group.addSetting((s) => {
			s.setName("Default note type")
				.setDesc("The note type to apply when none is set.")
				.addDropdown((d) => {
					d.addOptions(
						this.plugin.settings.types.reduce(
							(result, current) => {
								result[current.key] = current.name;
								return result;
							},
							{} as Record<string, string>,
						),
					)
						.setValue(
							this.plugin.settings.defaultNoteType ?? NO_TYPE_KEY,
						)
						.onChange((value) => {
							this.plugin.settings.defaultNoteType = value;
						});
				});
		});
	}

	types() {
		const group = new SettingGroup(this.containerEl);
		// XXX: why extra button have no setButtonText() ???
		group.setHeading("Note types").addExtraButton((b) => {
			b.setIcon("");
			const button = new ButtonComponent(b.extraSettingsEl);
			button
				.setButtonText("New")
				.setCta()
				.onClick(async () => {
					const data = await this.showModal();
					if (data != null) {
						types.push(data);
						this.plugin.saveSettings();
						this.display();
					}
				});
		});

		const types = this.plugin.settings.types;

		if (types.length === 0) {
			group.addSetting((s) => {
				s.setName("No items yet.");
			});
			return;
		}

		for (let index = 0; index < types.length; index++) {
			const item = types[index]!;

			group.addSetting((s) => {
				s.setName(
					createFragment((f) => {
						const containerEl = f.createDiv({
							cls: "setting-note-type-name-label",
						});
						containerEl.style.color = item.color ?? "";
						const iconEl = containerEl.createSpan();
						setIcon(iconEl, item.icon ?? DEFAULT_ICON);
						containerEl.createSpan({ text: item.name });
					}),
				)
					.addButton((btn) =>
						btn
							.setIcon("arrow-up")
							.setTooltip("Move up")
							.setDisabled(index === 0)
							.onClick(() => {
								if (index > 0) {
									const temp = types[index - 1]!;
									types[index - 1] = types[index]!;
									types[index] = temp;
								}
								void this.plugin.saveSettings();
								this.display();
							}),
					)
					.addButton((btn) =>
						btn
							.setIcon("arrow-down")
							.setTooltip("Move down")
							.setDisabled(index === types.length - 1)
							.onClick(() => {
								if (index < types.length - 1) {
									const temp = types[index + 1]!;
									types[index + 1] = types[index]!;
									types[index] = temp;
									void this.plugin.saveSettings();
									this.display();
								}
							}),
					)
					.addButton((btn) =>
						btn
							.setIcon("pencil")
							.setCta()
							.setTooltip("Edit")
							.onClick(async () => {
								const data = await this.showModal(index);
								if (data != null) {
									types[index] = data;
									this.plugin.saveSettings();
									this.display();
								}
							}),
					)
					.addButton((btn) =>
						btn
							.setIcon("copy")
							.setTooltip("Copy")
							.onClick(async () => {
								const data = await this.showModal(index);
								if (data != null) {
									types.splice(index + 1, 0, data);
									this.plugin.saveSettings();
									this.display();
								}
							}),
					)
					.addButton((btn) =>
						btn
							.setIcon("trash")
							.setClass("mod-warning")
							.setTooltip("Delete")
							.onClick(() => {
								types.splice(index, 1);
								void this.plugin.saveSettings();
								this.display();
							}),
					)
					.addToggle((t) =>
						t
							.setTooltip("Enabled")
							.setValue(!item.disabled)
							.onChange((value) => {
								item.disabled = !value;
								void this.plugin.saveSettings();
							}),
					);
			});
		}
	}

	showModal(index?: number) {
		return new Promise<NoteTypeData | null>((resolve) => {
			const type =
				index != null
					? structuredClone(this.plugin.settings.types[index]!)
					: undefined;
			new NoteTypeModal(this.plugin, {
				title: index != null ? "Update note type" : "Add note type",
				data: type,
				onSubmit: (newData) => {
					if (
						this.plugin.settings.types.some(
							(t, i) => t.key === newData.key && i !== index,
						)
					) {
						new Notice("Type key must be unique.");
						return false;
					}

					resolve(newData);

					return true;
				},
				onCancel: () => resolve(null),
			}).open();
		});
	}
}
