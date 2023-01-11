export interface ExtensionGeneratorSchema {
	/** Machine-readable extension name */
	name: string;
	/** Human-friendly extension name */
	displayName: string;
	/** A brief description for the package.json */
	description: string;
	/** Author field for the package.json */
	author: string;
	/** Publisher ID for the Visual Studio Marketplace */
	publisher: string;
	/** License ID for the package.json */
	license: string;
	/** URL for the Git repository */
	gitUrl: string;
	/** Add tags to the project (used for linting) */
	tags?: string;
	/** A directory where the project is placed */
	directory?: string;
}
