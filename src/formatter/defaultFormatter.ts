import { normalizePath, TFile, moment, parseYaml } from "obsidian";
import {
	FormatData,
	FormatOptions,
	Formatter,
	type FormatVariable,
} from "./types";

export const DEFAULT_FORMATTER_KEY = "Default";

export class DefaultFormatter extends Formatter {
	key = DEFAULT_FORMATTER_KEY;
	name = "Default";

	async formatTemplate(
		note: TFile,
		template: TFile,
		vars: Record<string, FormatVariable>,
		options: FormatOptions,
	): Promise<FormatData> {
		const templateContent =
			await this.plugin.app.vault.cachedRead(template);
		const formatted = format(templateContent, vars);

		const splitter = "---";
		const splitterLength = splitter.length;

		if (!formatted.startsWith(splitter)) {
			return { frontmatter: {}, content: formatted };
		}

		const endIndex = formatted.indexOf(splitter, splitterLength);
		if (endIndex === -1) {
			return { frontmatter: {}, content: formatted };
		}

		const frontmatterRaw = formatted
			.substring(splitterLength, endIndex)
			.trim();
		const frontmatter = parseYaml(frontmatterRaw) as Record<string, any>;
		const content = formatted
			.substring(endIndex + splitterLength)
			.trimStart();

		return { frontmatter, content };
	}
}

function format(content: string, vars: Record<string, FormatVariable>) {
	// {{ key }} or {{ key:format }} or {{ key.expression }}
	const regex = /\{\{\s*([^}]+?)\s*\}\}/g;

	vars = Object.entries(vars).reduce(
		(vars, [key, value]) => {
			vars[key.toLowerCase()] = value;
			return vars;
		},
		{} as Record<string, FormatVariable>,
	);

	return content.replace(regex, (_, rawExpr) =>
		resolvePlaceholder(String(rawExpr), vars),
	);
}

function resolvePlaceholder(
	rawExpression: string,
	variables: Record<string, FormatVariable>,
) {
	const expression = rawExpression.trim();
	const dotIndex = expression.indexOf(".");
	if (dotIndex >= 0) {
		return executeExpression(expression, dotIndex, variables);
	}

	const [key, format] = splitFomrat(expression);
	const value = getValue(variables, key);
	if (value == null) {
		return `{{${key} - NULL}}`;
	}

	if (moment.isMoment(value)) {
		return value.format(format ?? "YYYY-MM-DD HH:mm:ss");
	}

	return String(value ?? "");
}

function executeExpression(
	expression: string,
	dotIndex: number,
	variables: Record<string, FormatVariable>,
) {
	const key = expression.slice(0, dotIndex).trim();
	const expr = expression.slice(dotIndex).trim();
	const sourceValue = getValue(variables, key);
	if (sourceValue == null) {
		return `{{${key} - NULL}}`;
	}

	try {
		const evaluator = new Function("val", `return val${expr}`);
		const evalResult = evaluator(sourceValue);
		return String(evalResult ?? "");
	} catch {
		return `{{${expression} - ERROR}}`;
	}
}

function splitFomrat(expression: string) {
	const colonIndex = expression.indexOf(":");
	if (colonIndex < 0) {
		return [expression, undefined] as const;
	}

	return [
		expression.slice(0, colonIndex).trim(),
		expression.slice(colonIndex + 1).trim(),
	] as const;
}

function getValue(variables: Record<string, FormatVariable>, key: string) {
	const value = variables[key.toLowerCase()];
	if (value == null) {
		return null;
	}

	if (moment.isMoment(value)) {
		return value;
	}

	return value;
}
