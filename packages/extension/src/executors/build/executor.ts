import { ExecutorContext, parseTargetString, runExecutor } from "@nrwl/devkit";
import * as chalk from "chalk";
import * as esbuild from "esbuild";
import { promises as fs } from "fs";
import * as path from "path";
import * as rimraf from "rimraf";

import CLIOptions from "./schema";

interface Options extends CLIOptions {
	projectRoot: string;
}

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let options = normalizeOptions(opts, ctx);

		await clean(options);
		await bundle(options);
		await copyAssets(options);
		await runAdditionalTargets(options, ctx);

		return { success: true };
	} catch (err) {
		if (err) console.log(chalk.bold.redBright(err.stack ?? err));

		return {
			success: false,
			reason: err?.stack,
		};
	}
}

function normalizeOptions(opts: CLIOptions, ctx: ExecutorContext): Options {
	if (!ctx.projectName) {
		throw new Error("Expected project name to be non-null");
	}
	let projectRoot = ctx.workspace.projects[ctx.projectName].root;
	let entryPoint = path.join(ctx.root, projectRoot, opts.entryPoint);
	let outputPath = path.join(ctx.root, opts.outputPath);
	let outputFile = path.join(outputPath, opts.outputFile);

	return {
		...opts,
		projectRoot,
		entryPoint,
		outputPath,
		outputFile,
	};
}

function clean(opts: Options) {
	return new Promise<void>((resolve, reject) => {
		rimraf(opts.outputPath, err => {
			if (err) reject(err);
			else resolve();
		});
	});
}

async function bundle(opts: Options) {
	await esbuild.build({
		entryPoints: [opts.entryPoint],
		bundle: true,
		target: ["node14.14"],
		outfile: opts.outputFile,
	});
}

async function copyAssets(opts: Options) {
	if (!opts.assets) return;

	await Promise.all(
		opts.assets.map(file =>
			fs.copyFile(
				path.join(opts.projectRoot, file),
				path.join(opts.outputPath, file)
			)
		)
	);
}

async function runAdditionalTargets(opts: Options, ctx: ExecutorContext) {
	if (!opts.additionalTargets) return;

	for (let targetString of opts.additionalTargets) {
		let target = parseTargetString(targetString);

		for await (let result of await runExecutor(target, {}, ctx)) {
			if (!result.success) {
				throw new Error(`Failed to execute target ${targetString}`);
			}
		}
	}
}
