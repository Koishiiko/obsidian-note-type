import { App, ButtonComponent, PluginSettingTab, SettingGroup } from "obsidian";
import NoteTypePlugin from "./main";
import { NoteTypeModal } from "./components/noteTypeModal";

export interface NoteTypePluginSettings {
	propertyKey: string;
	hideProperty: boolean;
	alwaysShowProperties: boolean;
	types: NoteTypeData[];
}

export interface NoteTypeData {
	key: string;
	name: string;
	template?: string;
	formatter?: string;
}

export const DEFAULT_SETTINGS: NoteTypePluginSettings = {
	propertyKey: "noteType",
	hideProperty: true,
	alwaysShowProperties: true,
	types: [],
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
		this.types();
	}

	base() {
		const group = new SettingGroup(this.containerEl);

		group.addSetting((s) => {
			s.setName("Property key")
				.setDesc("The keys of note type property.")
				.addText((text) => {
					text.setValue(this.plugin.settings.propertyKey);
					text.inputEl.addEventListener("blur", (e) => {
						this.plugin.settings.propertyKey =
							text.inputEl.value.trim();
						this.plugin.saveSettings();
					});
				});
		});

		group.addSetting((s) => {
			s.setName("Hide property")
				.setDesc("Hide note type property.")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.hideProperty)
						.onChange((value) => {
							this.plugin.settings.hideProperty = value;
							this.plugin.saveSettings();
						}),
				);
		});

		group.addSetting((s) => {
			s.setName("Alway show properties")
				.setDesc("Show properties editor when peropety count is 0.")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.alwaysShowProperties)
						.onChange((value) => {
							this.plugin.settings.alwaysShowProperties = value;
							this.plugin.saveSettings();
						}),
				);
		});
	}

	types() {
		const group = new SettingGroup(this.containerEl);
		// XXX: why extra button have no setButtonText() ???
		group.setHeading("Note types").addExtraButton((b) => {
			b.setIcon("");
			const button = new ButtonComponent(b.extraSettingsEl);
			button
				.setButtonText("+ New")
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
			group.addSetting((s) => s.setName("No items yet."));
			return;
		}

		for (let index = 0; index < types.length; index++) {
			const item = types[index]!;

			group.addSetting((s) =>
				s
					.setName(item.name)
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
								this.plugin.saveSettings();
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
									this.plugin.saveSettings();
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
								this.plugin.saveSettings();
								this.display();
							}),
					),
			);
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
