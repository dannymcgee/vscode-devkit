export default interface Options {
	/**
	 * Language ID. Generally (but not always) this matches the file extension of
	 * source files written in the language.
	 */
	id: string;
	/**
	 * The grammar scope that serves as an entrypoint to the TextMate AST.
	 * Generally (but not always) this is "source.<id>".
	 */
	scopeName: string;
	/**
	 * Name for the grammar's Nx project. Must be valid for a filename. If not
	 * provided, will default to "<id>-grammar".
	 */
	name?: string;
	/**
	 * The Nx project for the VS Code extension this grammar will belong to.
	 */
	parentProjectName: string;
	/**
	 * Workspace-relative path to the directory for the generated JSON file. If
	 * not provided, will use the same output path as the parent project's
	 * `build` target.
	 */
	outputPath?: string;
	tags?: string;
	directory?: string;
}
