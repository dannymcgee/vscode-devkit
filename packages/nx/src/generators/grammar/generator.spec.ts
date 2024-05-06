import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree, readProjectConfiguration } from "@nx/devkit";

import generator from "./generator";
import GrammarGeneratorSchema from "./schema";

describe("grammar generator", () => {
	let appTree: Tree;
	const options: GrammarGeneratorSchema = {
		id: "foo",
		scopeName: "source.foo",
		parentProjectName: "vscode-foo",
	};

	beforeEach(() => {
		appTree = createTreeWithEmptyWorkspace();
	});

	it("should run successfully", async () => {
		await generator(appTree, options);
		const config = readProjectConfiguration(appTree, "test");
		expect(config).toBeDefined();
	});
});
