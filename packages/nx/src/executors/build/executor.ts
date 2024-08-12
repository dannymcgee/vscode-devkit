import { ExecutorContext, parseTargetString, runExecutor } from "@nx/devkit";
import * as chalk from "chalk";
import * as cp from "child_process";
import * as esbuild from "esbuild";
import * as path from "path";
import * as rimraf from "rimraf";

import * as nxUtil from "../../lib/util";
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

		if (options.package || options.install) {
			await packageExtension(options);
		}
		if (options.install) {
			await installExtension(options);
		}

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
	let projectRoot = nxUtil.getProject(ctx).root;
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
		format: "cjs",
		minify: opts.production,
		sourcemap: !opts.production,
		sourcesContent: false,
		platform: "node",
		target: "es2015",
		external: ["vscode"],
		outfile: opts.outputFile,
	});
}

async function copyAssets({ assets, projectRoot, outputPath }: Options) {
	if (!assets) return;

	await nxUtil.copyAssets({ assets, projectRoot, outputPath });
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

function packageExtension(opts: Options) {
	return new Promise<void>((resolve, reject) => {
		cp.spawn("npx vsce", ["package"], {
			cwd: opts.outputPath,
			shell: true,
			stdio: "inherit",
		})
			.on("error", reject)
			.on("close", code => {
				if (code) reject();
				else resolve();
			});
	});
}

async function installExtension(opts: Options) {
	let outPathRel = path.relative(__dirname, opts.outputPath);
	let pkgRel = path.join(outPathRel, "package.json");
	let { name, version } = await import(pkgRel);
	let vsix = `"${name}-${version}.vsix"`;

	return new Promise<void>((resolve, reject) => {
		cp.spawn("code", ["--install-extension", vsix], {
			cwd: opts.outputPath,
			shell: true,
			stdio: "inherit",
		})
			.on("error", reject)
			.on("close", code => {
				if (code) reject();
				else resolve();
			});
	});
}
