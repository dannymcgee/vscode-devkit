import { createTreeWithEmptyWorkspace } from "@nrwl/devkit/testing";
import { Tree, readProjectConfiguration } from "@nrwl/devkit";

import generator from "./generator";
import { ExtensionGeneratorSchema } from "./schema";

describe("nx generator", () => {
	let appTree: Tree;
	const options: ExtensionGeneratorSchema = { name: "test" };

	beforeEach(() => {
		appTree = createTreeWithEmptyWorkspace();
	});

	it("should run successfully", async () => {
		await generator(appTree, options);
		const config = readProjectConfiguration(appTree, "test");
		expect(config).toBeDefined();
	});
});
