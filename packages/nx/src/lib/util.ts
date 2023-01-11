import { ExecutorContext, ProjectConfiguration } from "@nrwl/devkit";

export function getProject(ctx: ExecutorContext, name?: string): ProjectConfiguration {
	let projects = ctx.projectsConfigurations ?? ctx.workspace;
	if (!projects) {
		throw new Error(
			"Failed to find project configurations: " +
			"neither `projectsConfigurations` nor `workspace` exist in the executor configuration"
		);
	}

	if (name) return projects[name];

	if (!ctx.projectName)
		throw new Error("No `projectName` in the executor context.");

	return projects[ctx.projectName];
}
