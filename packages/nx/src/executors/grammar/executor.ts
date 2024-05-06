import { ExecutorContext } from "@nx/devkit";
import { JsonObject, TMGrammar } from "@vscode-devkit/grammar";
import * as chalk from "chalk";
import * as esbuild from "esbuild";
import { promises as fs } from "fs";
import * as path from "path";

import { getProject } from "../../lib/util";
import CLIOptions from "./schema";

interface Options extends CLIOptions {
	projectRoot: string;
	grammarModulePath: string;
	grammarJsonPath: string;
}

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let options = await normalizeOptions(opts, ctx);
		let jsonContent = await compile(options);
		await writeOutput(jsonContent, options);

		return { success: true };
	} catch (err) {
		if (err) {
			let label = chalk.bold.redBright.inverse(" ERROR ");
			let message = chalk.bold.redBright(err.stack ?? err);
			console.log(`${label} ${message}`);
		}

		return {
			success: false,
			reason: err?.stack,
		};
	}
}

async function normalizeOptions(
	opts: CLIOptions,
	ctx: ExecutorContext
): Promise<Options> {
	let projectRoot = path.join(ctx.root, getProject(ctx).root);
	let entryPoint = path.join(ctx.root, opts.entryPoint);
	let outputPath = path.join(ctx.root, opts.outputPath);
	let grammarModulePath = path.join(outputPath, `${opts.name}.tmLanguage.js`);
	let grammarJsonPath = path.join(outputPath, `${opts.name}.tmLanguage.json`);

	return {
		...opts,
		entryPoint,
		outputPath,
		projectRoot,
		grammarModulePath,
		grammarJsonPath,
	};
}

async function compile(opts: Options) {
	await compileSrcModule(opts);
	let src = (await import(opts.grammarModulePath)).default as TMGrammar;
	let json = toJson(src);

	return JSON.stringify(json, null, "\t");
}

async function writeOutput(content: string, opts: Options) {
	try {
		await fs.stat(opts.outputPath);
	} catch {
		await fs.mkdir(opts.outputPath, { recursive: true });
	}
	await fs.writeFile(opts.grammarJsonPath, content);
	await fs.rm(opts.grammarModulePath);
}

async function compileSrcModule(opts: Options) {
	await esbuild.build({
		entryPoints: [opts.entryPoint],
		bundle: true,
		platform: "node",
		target: ["node14.14"],
		outfile: opts.grammarModulePath,
	});
}

function toJson(grammar: TMGrammar): JsonObject {
	let result: JsonObject = {};

	Object.entries(grammar).forEach(([key, value]) => {
		if (typeof value === "string") {
			result[key] = value;
		} else if (value instanceof RegExp) {
			result[key] = value.toString().replace(/^\/|\/$/g, "");
		} else if (Array.isArray(value)) {
			result[key] = value.map(toJson);
		} else {
			result[key] = toJson(value);
		}
	});

	return result;
}
