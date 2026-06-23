import type { CollectionEntry } from "astro:content";

type ProjectEntry = CollectionEntry<"projects">;

export function isVisibleProject(project: ProjectEntry) {
  return project.data.draft !== true;
}
