import { DropdownComponent, setIcon, Setting } from "obsidian";
import {
	PropertyRenderContext,
	PropertyWidget,
	PropertyWidgetComponentBase,
} from "obsidian-typings";
import NoteTypePlugin from "./main";

export const NOTE_TYPE_WIDGET_TYPE = "note-type:notetype";

export class NoteTypeWidget implements PropertyWidget {
	type = NOTE_TYPE_WIDGET_TYPE;
	icon: string;
	reservedKeys: string[] | undefined;

	plugin: NoteTypePlugin;

	constructor(plugin: NoteTypePlugin) {
		this.plugin = plugin;
		this.icon = plugin.settings.propertyIcon;
		this.reservedKeys = plugin.settings.keys;
	}

	name(): string {
		return "Note type";
	}

	render(
		containerEl: HTMLElement,
		data: unknown,
		context: PropertyRenderContext,
	): PropertyWidgetComponentBase {
		this.setIcon(containerEl);

		this.renderContent(containerEl, data, context);

		return {
			type: NOTE_TYPE_WIDGET_TYPE,
			focus: () => {},
		};
	}

	setIcon(containerEl: HTMLElement) {
		if (this.icon != null) {
			const iconEl = containerEl.parentElement?.querySelector(
				".metadata-property-icon",
			);
			if (iconEl instanceof HTMLElement) {
				setIcon(iconEl, this.icon);
			}
		}
	}

	renderContent(
		containerEl: HTMLElement,
		data: unknown,
		context: PropertyRenderContext,
	) {
		const dropdown = new DropdownComponent(containerEl);
		dropdown.selectEl.addClass("note-type-selector");
		dropdown.setValue("hello");
		dropdown.addOptions({
			hello: "world",
			world: "hello",
		});
	}

	validate(value: unknown): boolean {
		return true;
	}
}
