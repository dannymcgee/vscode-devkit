import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree, readProjectConfiguration } from "@nx/devkit";

import generator from "./generator";
import ExtensionGeneratorSchema from "./schema";

describe("nx generator", () => {
	let appTree: Tree;
	const options: ExtensionGeneratorSchema = {
		name: "test",
		displayName: "Test",
		publisher: "testymctesterson",
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
