import { AssetGlob } from "@nx/workspace/src/utilities/assets";

export default interface Options {
	assets?: (string|AssetGlob)[];
	additionalTargets?: string[];
	entryPoint: string;
	outputPath: string;
	outputFile: string;
	package?: boolean;
	install?: boolean;
}
