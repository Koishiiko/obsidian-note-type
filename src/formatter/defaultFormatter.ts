import { TFile, moment } from "obsidian";
import {
	FormatData,
	FormatOptions,
	Formatter,
	type FormatVariable,
} from "./types";
import { splitFrontmatter } from "./utils";

export const DEFAULT_FORMATTER_KEY = "default";

export class DefaultFormatter extends Formatter {
	key = DEFAULT_FORMATTER_KEY;
	name = "Default";

	async formatTemplate(
		note: TFile,
		template: TFile,
		_options: FormatOptions,
	): Promise<FormatData> {
		const templateContent =
			await this.plugin.app.vault.cachedRead(template);
		const formatted = format(templateContent, defaultVariables(note));
		return splitFrontmatter(formatted);
	}
}

function format(content: string, variables: Record<string, FormatVariable>) {
	// {{ key }} or {{ key:format }} or {{ key.property.sub }}
	const regex = /\{\{\s*([^}]+?)\s*\}\}/g;

	const normalizedVars = Object.fromEntries(
		Object.entries(variables).map(([k, v]) => [k.toLowerCase(), v]),
	);

	return content.replace(regex, (_, rawExpr) =>
		resolvePlaceholder(String(rawExpr), normalizedVars),
	);
}

function resolvePlaceholder(
	rawExpression: string,
	variables: Record<string, FormatVariable>,
): string {
	const expression = rawExpression.trim();

	if (!isDateFormat(expression, variables)) {
		return executeExpression(expression, variables);
	}

	const [key, formatStr] = splitFormat(expression);
	const value = variables[key.toLowerCase()];

	if (value == null) {
		return `{{${key} - NULL}}`;
	}

	if (moment.isMoment(value)) {
		return value.format(formatStr ?? "YYYY-MM-DD HH:mm:ss");
	}

	return value.toString();
}

function isDateFormat(
	expression: string,
	variables: Record<string, FormatVariable>,
) {
	const colonIndex = expression.indexOf(":");
	if (colonIndex === -1) {
		return false;
	}

	const left = expression.split(":")[0]?.toLocaleLowerCase();
	return left != null && moment.isMoment(variables[left]);
}

function executeExpression(
	expression: string,
	variables: Record<string, FormatVariable>,
) {
	try {
		const keys = Object.keys(variables);
		const evaluator = new Function(
			"moment",
			...keys,
			`return ${expression};`,
		);
		const evalResult = evaluator(
			moment,
			...keys.map((k) => variables[k]),
		) as string;
		return evalResult ?? "";
	} catch (ex) {
		console.error(
			`[Note type] Failed to execute expression: ${expression}`,
			ex,
		);
		return `{{${expression} - ${ex}}}`;
	}
}

function splitFormat(expression: string) {
	const colonIndex = expression.indexOf(":");
	if (colonIndex < 0) {
		return [expression, undefined] as const;
	}

	return [
		expression.slice(0, colonIndex).trim(),
		expression.slice(colonIndex + 1).trim(),
	] as const;
}

function defaultVariables(note?: TFile | null): Record<string, FormatVariable> {
	return {
		note,
		now: moment(),
		date: moment(),
	};
}
