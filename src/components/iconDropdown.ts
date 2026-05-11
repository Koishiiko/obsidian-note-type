import { setIcon } from "obsidian";

export interface IconDropdownOption {
	key: string;
	name: string;
	icon?: string;
	iconColor?: string;
}

export const DEFAULT_ICON = "book";

export class IconDropdown {
	parentEl: HTMLElement;
	containerEl: HTMLElement;
	triggerEl: HTMLElement;
	menuEl: HTMLElement;
	value: string;
	changeCallback?: (value: string) => any;

	options: IconDropdownOption[] = [];

	isOpen = false;

	constructor(containerEl: HTMLElement, defaultValue = "") {
		this.parentEl = containerEl;
		this.containerEl = this.parentEl.createDiv({ cls: "icon-dropdown" });
		this.value = defaultValue;

		this.triggerEl = this.containerEl.createDiv({
			cls: "dropdown icon-dropdown-trigger",
		});
		this.renderTrigger();

		this.menuEl = this.containerEl.createDiv({ cls: "icon-dropdown-menu" });
		this.menuEl.style.display = "none";

		this.triggerEl.addEventListener("click", (e: MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			this.toggle();
		});

		document.addEventListener("click", (e: MouseEvent) => {
			if (this.isOpen && !this.containerEl.contains(e.target as Node)) {
				this.close();
			}
		});
	}

	getValue() {
		return this.value;
	}

	setValue(value: string) {
		this.value = value;
		this.renderTrigger();
		const items = this.menuEl.querySelectorAll<HTMLElement>(
			".icon-dropdown-item",
		);
		items.forEach((item) => {
			item.toggleClass("is-selected", item.dataset.key === value);
		});
	}

	onChange(callback: (value: string) => any) {
		this.changeCallback = callback;
	}

	addOption(option: IconDropdownOption) {
		this.options.push(option);
		this.renderMenuItem(option);

		if (option.key === this.value) {
			this.renderTrigger();
		}
	}

	addOptions(options: IconDropdownOption[]) {
		for (const option of options) {
			this.options.push(option);
			this.renderMenuItem(option);
		}

		if (this.options.length > 0 && !this.value) {
			const first = this.options[0];
			if (first) {
				this.value = first.key;
			}
		}
		this.renderTrigger();
	}

	private toggle() {
		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
	}

	private open() {
		this.isOpen = true;
		this.menuEl.style.display = "block";
		this.containerEl.addClass("is-open");
	}

	private close() {
		this.isOpen = false;
		this.menuEl.style.display = "none";
		this.containerEl.removeClass("is-open");
	}

	private findSelectedOption(): IconDropdownOption | undefined {
		return this.options.find((o) => o.key === this.value);
	}

	private renderTrigger() {
		this.triggerEl.empty();
		const selected = this.findSelectedOption();

		const iconEl = this.triggerEl.createSpan({
			cls: "icon-dropdown-trigger-icon",
		});
		iconEl.style.color = selected?.iconColor ?? "";
		setIcon(iconEl, selected?.icon ?? DEFAULT_ICON);

		this.triggerEl.createSpan({
			cls: "icon-dropdown-trigger-text",
			text: selected?.name ?? "",
		});
	}

	private renderMenuItem(option: IconDropdownOption) {
		const itemEl = this.menuEl.createDiv({
			cls: "icon-dropdown-item",
			attr: { "data-key": option.key },
		});

		if (option.key === this.value) {
			itemEl.addClass("is-selected");
		}

		const iconEl = itemEl.createSpan({ cls: "icon-dropdown-item-icon" });
		setIcon(iconEl, option.icon ?? DEFAULT_ICON);
		iconEl.style.color = option.iconColor ?? "";

		itemEl.createSpan({
			cls: "icon-dropdown-item-text",
			text: option.name,
		});

		itemEl.addEventListener("click", (e: MouseEvent) => {
			e.stopPropagation();
			this.selectOption(option);
		});
	}

	private selectOption(option: IconDropdownOption) {
		this.value = option.key;
		this.renderTrigger();
		this.setValue(option.key);
		this.close();
		this.changeCallback?.(option.key);
	}
}
