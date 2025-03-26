#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
// import patterns from "../../src/patterns.json" assert { type: "json" }; // node < 22
// import patterns from "../../src/patterns.json" with { type: "json" }; // node >= 22
// TODO: Fix the import statement ESM import attributes are more consistent between active versions
// @see https://nodejs.org/api/esm.html#import-attributes
let patterns = JSON.parse(
	await readFile("src/patterns.json", { encoding: "utf-8" }),
);

let pattern = new RegExp(
	patterns
		.map((pattern) => pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
		.join("|"),
).source;

let expression = new RegExp(patterns.join("|"), "i").toString();

let code = `export let fullPattern: string = "${pattern}";\n`;
await writeFile("src/pattern.ts", code);
