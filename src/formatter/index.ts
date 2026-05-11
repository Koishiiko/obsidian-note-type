import NoteTypePlugin from "../main";
import { DefaultFormatter } from "./defaultFormatter";
import { TemplaterFormatter } from "./templaterFormatter";
import { Formatter, FormatData } from "./types";

export { DEFAULT_FORMATTER_KEY } from "./defaultFormatter";

export { Formatter, type FormatData };

export function initFormatters(plugin: NoteTypePlugin) {
	return [new DefaultFormatter(plugin), new TemplaterFormatter(plugin)];
}
