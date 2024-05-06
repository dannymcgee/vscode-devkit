import {
	checkFilesExist,
	ensureNxProject,
	readJson,
	runNxCommandAsync,
	uniq,
} from "@nx/plugin/testing";

describe("nx e2e", () => {
	it("should create extension", async () => {
		const project = uniq("extension");
		ensureNxProject("@vscode-devkit/nx", "dist/packages/nx");
		await runNxCommandAsync(`generate @vscode-devkit/nx:extension ${project}`);

		const result = await runNxCommandAsync(`build ${project}`);
		expect(result.stdout).toContain("Executor ran");
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			const project = uniq("extension");
			ensureNxProject("@vscode-devkit/nx", "dist/packages/nx");
			await runNxCommandAsync(
				`generate @vscode-devkit/nx:extension ${project} --directory subdir`
			);
			expect(() =>
				checkFilesExist(`libs/subdir/${project}/src/index.ts`)
			).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			const plugin = uniq("nx");
			ensureNxProject("@vscode-devkit/nx", "dist/packages/nx");
			await runNxCommandAsync(
				`generate @vscode-devkit/nx:extension ${plugin} --tags e2etag,e2ePackage`
			);
			const nxJson = readJson("nx.json");
			expect(nxJson.projects[plugin].tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
