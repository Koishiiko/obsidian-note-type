import { TFile, moment } from "obsidian";
import { FormatVariable } from "./types";

export function defaultVariables(
	note?: TFile | null,
): Record<string, FormatVariable> {
	return {
		note,
		now: moment(),
		date: moment(),
	};
}
