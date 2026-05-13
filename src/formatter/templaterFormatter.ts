import { App, TFile } from "obsidian";
import { FormatData, FormatOptions, Formatter } from "./types";
import { splitFrontmatter } from "./utils";

// https://github.com/SilentVoid13/Templater
export class TemplaterFormatter extends Formatter {
	key = "templater";
	name = "Templater";

	async formatTemplate(
		note: TFile,
		template: TFile,
		_options: FormatOptions,
	): Promise<FormatData> {
		const templater = getTemplater(this.plugin.app);

		const formatted = await templater.templater.read_and_parse_template({
			template_file: template,
			target_file: note,
			run_mode: "CreateNewFromTemplate",
			active_file: note,
		});

		return splitFrontmatter(formatted);
	}
}

const TEMPLATER_PLUGIN_KEY = "templater-obsidian";

interface TemplaterPlugin {
	templater: {
		read_and_parse_template(config: RunningConfig): Promise<string>;
	};
}

interface RunningConfig {
	template_file: TFile;
	target_file: TFile;
	run_mode: "CreateNewFromTemplate";
	active_file: TFile;
}

function getTemplater(app: App) {
	const templater = app.plugins.plugins[TEMPLATER_PLUGIN_KEY] as
		| TemplaterPlugin
		| undefined;
	if (templater == null) {
		throw new Error("Templater plugin is not install");
	}
	return templater;
}
