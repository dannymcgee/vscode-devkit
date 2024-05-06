import {
	addProjectConfiguration,
	formatFiles,
	generateFiles,
	getWorkspaceLayout,
	names,
	offsetFromRoot,
	ProjectConfiguration,
	readProjectConfiguration,
	TargetConfiguration,
	Tree,
	updateJson,
	updateProjectConfiguration,
} from "@nx/devkit";
import chalk = require("chalk");
import * as path from "path";

import ExtensionBuildOptions from "../../executors/build/schema";
import CliOptions from "./schema";

interface NormalizedOptions {
	id: string;
	scopeName: string;
	name: string;
	parentProjectName: string;
	projectRoot: string;
	projectDirectory: string;
	outputPath: string;
	parsedTags: string[];
}

export default async function (tree: Tree, opts: CliOptions) {
	const options = normalizeOptions(tree, opts);

	addProjectConfiguration(tree, options.name, {
		root: options.projectRoot,
		projectType: "library",
		sourceRoot: `${options.projectRoot}/src`,
		targets: {
			build: {
				executor: "@vscode-devkit/nx:grammar",
				options: {
					name: options.id,
					entryPoint: `${options.projectRoot}/src/index.ts`,
					outputPath: options.outputPath,
				},
			},
		},
		tags: options.parsedTags,
	});

	addFiles(tree, options);

	try {
		updateFiles(tree, options);
	} catch (err) {
		const label = chalk.bold.yellowBright.inverse(" WARN ");
		console.log(`${label} Unable to update parent project: ${err.message}`);
		console.log(
			`${label} You will need to update the extension configuration manually to reference the ` +
				`new grammar.`
		);
		console.log(
			`${label} Alternatively, you may undo the changes made, fix the underlying issue, and ` +
				`try running the generator again.`
		);
	}

	await formatFiles(tree);
}

function normalizeOptions(tree: Tree, opts: CliOptions): NormalizedOptions {
	const name = opts.name ?? `${opts.id}-grammar`;
	const projectDirectory = opts.directory
		? `${names(opts.directory).fileName}/${name}`
		: name;

	const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
	const parsedTags = opts.tags?.split(",").map(s => s.trim()) ?? [];

	const outputPath =
		opts.outputPath ?? findOutputPath(tree, opts.parentProjectName);

	return {
		...opts,
		name,
		projectRoot,
		projectDirectory,
		outputPath,
		parsedTags,
	};
}

function findOutputPath(tree: Tree, parentProject: string): string {
	let options: ExtensionBuildOptions | undefined;
	try {
		const parentConfig = readProjectConfiguration(tree, parentProject);
		options = getParentBuildTarget(parentConfig).options;
	} catch (err) {
		throw new Error(
			`${err.message}. You will need to manually specify an "outputPath" for the grammar.`
		);
	}

	if (!options)
		throw new Error(
			`No options found for ${parentProject}'s "build" target. You will need ` +
				`to manually specify an "outputPath" for the grammar.`
		);

	return options.outputPath;
}

function getParentBuildTarget(
	project: ProjectConfiguration
): TargetConfiguration<ExtensionBuildOptions> {
	const targets = project.targets;
	if (!targets)
		throw new Error(`No targets found for parent project "${project.name}"`);

	if (!("build" in targets))
		throw new Error(`No "build" target found in ${project.name} targets`);

	return targets["build"];
}

function addFiles(tree: Tree, opts: NormalizedOptions) {
	const templateOptions = {
		...opts,
		offsetFromRoot: offsetFromRoot(opts.projectRoot),
		template: "",
	};

	generateFiles(
		tree,
		path.join(__dirname, "files"),
		opts.projectRoot,
		templateOptions
	);
}

function updateFiles(tree: Tree, opts: NormalizedOptions) {
	const parentConfig = readProjectConfiguration(tree, opts.parentProjectName);
	const buildTarget = getParentBuildTarget(parentConfig);

	updateProjectConfiguration(tree, opts.parentProjectName, {
		...parentConfig,
		targets: {
			...parentConfig.targets,
			build: {
				...buildTarget,
				options: {
					...(buildTarget.options ?? {}),
					additionalTargets: [
						...(buildTarget.options?.additionalTargets ?? []),
						`${opts.name}:build`,
					],
				},
			},
		},
	});

	const parentPkgJson = `${parentConfig.root}/package.json`;
	if (!tree.exists(parentPkgJson))
		throw new Error("No package.json found for parent project.");

	const outputRoot = buildTarget.options?.outputPath
		? path.relative(buildTarget.options.outputPath, opts.outputPath)
		: ".";

	updateJson(tree, parentPkgJson, pkg => ({
		...pkg,
		contributes: {
			...(pkg["contributes"] ?? {}),
			grammars: [
				...(pkg["contributes"]?.["grammars"] ?? []),
				{
					language: opts.id,
					scopeName: opts.scopeName,
					path: path.join(outputRoot, `${opts.id}.tmLanguage.json`),
				},
			],
		},
	}));
}
