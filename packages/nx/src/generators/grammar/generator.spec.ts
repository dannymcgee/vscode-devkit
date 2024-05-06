import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree, readProjectConfiguration, addProjectConfiguration } from "@nx/devkit";

import generator from "./generator";
import GrammarGeneratorSchema from "./schema";

describe("grammar generator", () => {
	let appTree: Tree;
	const options: GrammarGeneratorSchema = {
		name: "foo-grammar",
		id: "foo",
		scopeName: "source.foo",
		parentProjectName: "vscode-foo",
	};

	beforeEach(() => {
		appTree = createTreeWithEmptyWorkspace();

		addProjectConfiguration(appTree, "vscode-foo", {
			projectType: "application",
			root: "apps/vscode-foo",
			sourceRoot: "apps/vscode-foo/src",
			targets: {
				build: {
					executor: "@vscode-devkit/nx:build",
					options: {
						outputPath: "dist/vscode-foo",
					},
				},
			},
		});

		appTree.write("apps/vscode-foo/package.json", JSON.stringify({

		}))
	});

	it("should run successfully", async () => {
		await generator(appTree, options);

		const grammarConfig = readProjectConfiguration(appTree, "foo-grammar");
		expect(grammarConfig).toBeDefined();

		const parentConfig = readProjectConfiguration(appTree, "vscode-foo");
		expect(parentConfig).toBeDefined();

		const parentTargets = parentConfig.targets;
		expect(parentTargets).toBeDefined();

		const buildTarget = parentTargets["build"];
		expect(buildTarget).toBeDefined();

		const buildOptions = buildTarget.options;
		expect(buildOptions).toBeDefined();
		expect(buildOptions.additionalTargets).toEqual(["foo-grammar:build"]);
	});
});
