import {
	ExecutorContext,
	ProjectConfiguration,
	ProjectsConfigurations,
} from "@nx/devkit";
import { AssetGlob, assetGlobsToFiles } from "@nx/js/src/utils/assets/assets";
import * as fs from "fs";
import * as path from "path";

export function getProjects(ctx: ExecutorContext): ProjectsConfigurations {
	let projects = ctx.projectsConfigurations ?? ctx.workspace;
	if (!projects) {
		throw new Error(
			"Failed to find project configurations: " +
				"neither `projectsConfigurations` nor `workspace` exist in the executor configuration"
		);
	}

	return projects;
}

export function getProject(
	ctx: ExecutorContext,
	name?: string
): ProjectConfiguration {
	let { projects } = getProjects(ctx);
	name ??= ctx.projectName;

	if (!name) {
		const err = new Error(
			"No project name was provided to `getProject`, and no `projectName` " +
				"field exists in the executor context."
		);

		console.log("Executor context:");
		console.log(ctx);

		throw err;
	}

	if (!projects[name]) {
		const err = new Error(`Project "${name}" not found in projects configuration`);

		if (ctx.isVerbose) {
			console.log("Project configuration:");
			console.log(projects);
		}

		throw err;
	}

	return projects[name];
}

interface CopyAssetsParams {
	assets: (string | AssetGlob)[];
	/** Absolute path to the project root. */
	projectRoot: string;
	/** Absolute path to the output root. */
	outputPath: string;
}

export async function copyAssets({
	assets,
	projectRoot,
	outputPath,
}: CopyAssetsParams) {
	await Promise.all(
		assetGlobsToFiles(assets, projectRoot, outputPath).map(async file => {
			const dirname = path.dirname(file.output);
			if (!fs.existsSync(dirname))
				await fs.promises.mkdir(dirname, { recursive: true });

			await fs.promises.copyFile(file.input, file.output);
		})
	);
}
