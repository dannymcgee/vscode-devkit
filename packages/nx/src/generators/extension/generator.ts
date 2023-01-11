import {
	addProjectConfiguration,
	formatFiles,
	generateFiles,
	getWorkspaceLayout,
	names,
	offsetFromRoot,
	Tree,
} from "@nrwl/devkit";
import * as path from "path";

import CliOptions from "./schema";

interface NormalizedOptions {
	name: string;
	displayName: string;
	description: string;
	author: string;
	publisher: string;
	license: string;
	gitUrl: string;
	projectName: string;
	projectRoot: string;
	projectDirectory: string;
	parsedTags: string[];
}

function normalizeOptions(
	host: Tree,
	{ name, displayName, publisher, ...opts }: CliOptions,
): NormalizedOptions {
	const description = opts.description ?? "";
	const author = opts.author ?? "";
	const gitUrl = opts.gitUrl ?? "";
	const license = opts.license ?? "MIT";

	const projectDirectory = opts.directory
		? `${names(opts.directory).fileName}/${name}`
		: name;

	const projectName = projectDirectory.replace(/\//g, "-");
	const projectRoot = `${getWorkspaceLayout(host).libsDir}/${projectDirectory}`;
	const parsedTags = opts.tags?.split(",").map(s => s.trim()) ?? [];

	return {
		name,
		displayName,
		publisher,
		description,
		author,
		gitUrl,
		license,
		projectName,
		projectRoot,
		projectDirectory,
		parsedTags,
	};
}

function addFiles(host: Tree, options: NormalizedOptions) {
	const templateOptions = {
		...options,
		...names(options.name),
		offsetFromRoot: offsetFromRoot(options.projectRoot),
		template: "",
	};

	generateFiles(
		host,
		path.join(__dirname, "files"),
		options.projectRoot,
		templateOptions
	);
}

export default async function (host: Tree, opts: CliOptions) {
	const options = normalizeOptions(host, opts);

	addProjectConfiguration(host, options.projectName, {
		root: options.projectRoot,
		projectType: "library",
		sourceRoot: `${options.projectRoot}/src`,
		targets: {
			build: {
				executor: "@vscode-devkit/nx:build",
			},
		},
		tags: options.parsedTags,
	});

	addFiles(host, options);

	await formatFiles(host);
}
