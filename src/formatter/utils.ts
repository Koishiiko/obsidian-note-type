import { parseYaml } from "obsidian";

export function splitFrontmatter(text: string) {
	const splitter = "---";
	const splitterLength = splitter.length;

	if (!text.startsWith(splitter)) {
		return { frontmatter: {}, content: text };
	}

	const endIndex = text.indexOf(splitter, splitterLength);
	if (endIndex === -1) {
		return { frontmatter: {}, content: text };
	}

	const frontmatterRaw = text.substring(splitterLength, endIndex).trim();
	const frontmatter = parseYaml(frontmatterRaw) as Record<string, any>;
	const content = text.substring(endIndex + splitterLength).trimStart();

	return { frontmatter, content };
}
