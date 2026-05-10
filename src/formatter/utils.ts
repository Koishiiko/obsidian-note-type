import { TFile, moment } from "obsidian";
import { FormatVariable } from "./types";

export function defaultVairables(
	note?: TFile | null,
): Record<string, FormatVariable> {
	return {
		note,
		now: moment(),
		date: moment(),
	};
}
