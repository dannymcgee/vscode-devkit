import { AssetGlob } from "@nx/js/src/utils/assets/assets";

export default interface Options {
	assets?: (string | AssetGlob)[];
	additionalTargets?: string[];
	entryPoint: string;
	outputPath: string;
	outputFile: string;
	package?: boolean;
	install?: boolean;
	minify?: boolean;
	sourceMaps?: boolean;
}
