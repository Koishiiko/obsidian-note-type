export class RadioGroupComponent {
	private containerEl: HTMLElement;
	private options: Record<string, string> = {};
	private onChangeCallback?: (value: string) => void;
	private currentValue: string;
	private radioInputs: HTMLInputElement[] = [];

	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl;
		this.currentValue = "";
	}

	addOptions(options: Record<string, string>): this {
		this.options = options;
		return this;
	}

	setValue(value: string): this {
		this.currentValue = value;
		return this;
	}

	getValue(): string {
		return this.currentValue;
	}

	onChange(callback: (value: string) => void): this {
		this.onChangeCallback = callback;
		return this;
	}

	build(): this {
		this.containerEl.empty();
		this.radioInputs = [];

		const wrapper = this.containerEl.createDiv("mod-radio-group");

		Object.entries(this.options).forEach(([key, value]) => {
			const label = wrapper.createEl("label", {
				cls: "mod-radio-label",
			});

			const input = label.createEl("input", {
				type: "radio",
				attr: { key, value: key },
			});

			if (key === this.currentValue) {
				input.checked = true;
			}

			input.addEventListener("change", () => {
				if (input.checked) {
					this.currentValue = key;
					this.onChangeCallback?.(key);
				}
			});

			this.radioInputs.push(input);

			label.createSpan({ text: value });
		});

		return this;
	}
}
