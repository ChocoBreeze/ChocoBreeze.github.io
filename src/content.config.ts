import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string().optional().default(''),
		// Transform string to Date object
		pubDate: z.coerce.date().optional(),
		date: z.coerce.date().optional(), // Jekyll field
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional().nullable(),
		image: z.string().optional().nullable(), // Jekyll field
		tags: z.array(z.string()).optional().nullable(),
		categories: z.union([z.string(), z.array(z.string())]).optional().nullable(),
		difficulty: z.string().optional().nullable(),
		topics: z.array(z.string()).optional().nullable(),
		pinned: z.boolean().optional().default(false),
		order: z.number().optional(),
	}),
});

export const collections = { blog };
