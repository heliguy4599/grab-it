import { walk } from "@std/walk"
import { resolve } from "@std/path"

type WalkOptions = {
	at: string,
	hidden: boolean,
	exclude: string[],
	ignoreCase: boolean,
	dirs: boolean,
	depth?: number,
}

export async function* walker(opts: WalkOptions) {
	const root = resolve(opts.at)
	const skip: RegExp[] = []
	if (!opts.hidden) {
		skip.push(/\/\.[^/]/)
	}
	for (const ex of opts.exclude) {
		const flags = opts.ignoreCase ? "i" : ""
		const escaped = ex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		skip.push(new RegExp(`/${escaped}(/|$)`, flags))
	}
	for await (const entry of walk(root, {
		maxDepth: opts.depth,
		includeFiles: true,
		includeDirs: false,
		skip,
	})) {
		if (entry.path === root) continue
		yield entry
	}
}

const globToRegex = (pattern: string, ignoreCase: boolean): RegExp => {
	const flags = ignoreCase ? "i" : ""
	let src = ""
	const segments = pattern.split("/")
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]
		const last = i === segments.length - 1
		if (seg === "**") {
			src += "(?:.+/)?"
		} else {
			src += seg.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")
			if (!last) {
				src += "/"
			}
		}
	}
	return new RegExp(`^${src}$`, flags)
}

export const matchesPatterns = (relPath: string, patterns: string[], ignoreCase: boolean): boolean => (
	patterns.some((p) => globToRegex(p, ignoreCase).test(relPath))
)

