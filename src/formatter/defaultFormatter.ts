import { TFile, moment, parseYaml } from "obsidian";
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
		options: FormatOptions,
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
	const dotIndex = expression.indexOf(".");

	if (dotIndex >= 0) {
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

	return String(value);
}

function executeExpression(
	expression: string,
	variables: Record<string, FormatVariable>,
): string {
	const segments = expression.split(".").map((s) => s.trim());

	const rootKey = segments[0]!.toLowerCase();
	let value: unknown = variables[rootKey];

	if (value == null) {
		return `{{${rootKey} - NULL}}`;
	}

	for (let i = 1; i < segments.length; i++) {
		const prop = segments[i]!;
		if (prop === "" || value == null || typeof value !== "object") {
			return `{{${expression} - ERROR}}`;
		}
		value = (value as Record<string, unknown>)[prop];
	}

	return String(value ?? "");
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
