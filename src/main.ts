import { relative } from "@std/path"
import { program } from "commander"

import denoJson from "../deno.json" with { type: "json" }
import { walker, matchesPatterns } from "./dir_walk.ts"

program
.name(denoJson.name)
.version(denoJson.version)
.description(denoJson.description)
.argument("[pattern...]", "Glob patterns to match")
.option("-x, --exclude <paths...>", "Exclude directories or path segments", [])
.option("-H, --hidden", "Include hidden files and directories", false)
.option("-d, --dirs", "Also match directories", false)
.option("-i, --ignore-case", "Case-insensitive matching", false)
.option("--absolute", "Output absolute paths", false)
.option("--at <path>", "Directory to start searching from.", ".")
.option("--prefix <prefix>", "Add a prefix to all printed paths.", "")
.option("--depth <n>", "Maximum directory depth", parseInt)

program.parse(Deno.args, { from: "user" })

type Opts = {
	exclude?: string[],
	hidden: boolean,
	dirs: boolean,
	ignoreCase: boolean,
	absolute: boolean,
	at: string,
	prefix: string,
	depth?: number,
}

const patterns: string[] = program.args

if (patterns.length === 0) {
	console.error("grab: no patterns given. Run `grab --help` for usage.")
	Deno.exit(1)
}

const opts: Opts = program.opts()
const { at, depth, hidden, exclude = [], ignoreCase, dirs, absolute, prefix } = opts

for await (const entry of walker({ at, depth, hidden, exclude, ignoreCase, dirs })) {
	const relPath = relative(at, entry.path)
	if (!matchesPatterns(relPath, patterns, ignoreCase)) continue
	console.log(prefix + (absolute ? entry.path : relPath))
}
