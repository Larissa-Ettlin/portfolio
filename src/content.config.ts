import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const fallbackDate = new Date("1970-01-01");

function normalizeProjectImagePath(path?: string) {
  if (!path) return path;
  if (path.startsWith("/uploads/")) return path;
  if (path.startsWith("./images/")) {
    return `/uploads/${path.slice("./images/".length)}`;
  }
  return path;
}

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: () =>
    z
      .object({
        // Pflichtfelder
        name: z.string(),
        cover: z.string(),

        // Optionale Felder
        description: z.string().optional().default(""),

        date: z.preprocess(
          (value) => {
            if (value === "" || value === null || value === undefined) {
              return undefined;
            }
            return value;
          },
          z.coerce.date().default(fallbackDate)
        ),

        coverAlt: z.string().optional().default(""),

        tags: z.array(z.string()).optional().default([]),

        draft: z.boolean().optional().default(false),

        // Optionales Logo.
        // Falls kein Logo gesetzt ist, wird später automatisch das Cover als Logo-Ersatz verwendet.
        // Falls eine alte Decap-Datei logo als String gespeichert hat, wird das ebenfalls abgefangen.
        logo: z.preprocess(
          (value) => {
            if (!value || value === false) return undefined;

            if (typeof value === "string") {
              return { image: value };
            }

            return value;
          },
          z
            .object({
              image: z.string().optional(),
              fallback: z
                .object({
                  text: z.string().optional().default(""),
                  bgColor: z.string().optional().default("bg-neutral-500"),
                })
                .optional()
                .default({
                  text: "",
                  bgColor: "bg-neutral-500",
                }),
            })
            .optional()
        ),

        // Optionale Case Study.
        // Alte Werte wie caseStudy: false werden ignoriert.
        caseStudy: z.preprocess(
          (value) => {
            if (!value || typeof value === "boolean") return undefined;
            return value;
          },
          z
            .object({
              challenge: z.string().optional().default(""),
              solution: z.string().optional().default(""),
              results: z.array(z.string()).optional().default([]),
              links: z
                .array(
                  z.object({
                    text: z.string().optional().default(""),
                    url: z.string().optional().default(""),
                  })
                )
                .optional()
                .default([]),
            })
            .optional()
            .default({
              challenge: "",
              solution: "",
              results: [],
              links: [],
            })
        ),
      })
      .transform((project) => {
        const fallbackLetter =
          project.logo?.fallback?.text?.trim() ||
          project.name.slice(0, 1).toUpperCase() ||
          "?";

        return {
          ...project,

          description: project.description || "",
          cover: normalizeProjectImagePath(project.cover) || "",
          coverAlt: project.coverAlt || project.name,
          tags: project.tags || [],
          draft: project.draft ?? false,

          logo: {
            image:
              normalizeProjectImagePath(project.logo?.image) ||
              normalizeProjectImagePath(project.cover) ||
              "",
            fallback: {
              text: fallbackLetter.slice(0, 1),
              bgColor: project.logo?.fallback?.bgColor || "bg-neutral-500",
            },
          },

          caseStudy: {
            challenge: project.caseStudy?.challenge || "",
            solution: project.caseStudy?.solution || "",
            results: project.caseStudy?.results || [],
            links: (project.caseStudy?.links || [])
              .filter((link) => link.text && link.url)
              .map((link) => ({
                text: link.text || "",
                url: link.url || "",
              })),
          },
        };
      }),
});

export const collections = {
  projects,
};
