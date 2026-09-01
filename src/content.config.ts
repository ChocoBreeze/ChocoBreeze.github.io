import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { isValidEtfMetadataValue } from './data/etfMetadata.mjs';

const etfMetadataField = (field: string) =>
	z
		.string()
		.trim()
		.min(1)
		.refine((value) => isValidEtfMetadataValue(field, value), {
			message: `Invalid ETF metadata value for ${field}.`,
		});

const etfVolatileMetadataField = z
	.union([z.string().trim().min(1), z.number().refine(Number.isFinite)])
	.optional()
	.nullable();

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		slug: z.string().optional(),
		description: z.string().optional().default(''),
		// Transform string to Date object
		pubDate: z.coerce.date().optional(),
		date: z.coerce.date().optional(), // Jekyll field
		updatedDate: z.coerce.date().optional(),
		verifiedDate: z.coerce.date().optional(),
		dataAsOf: z.coerce.date().optional(),
		briefType: z.enum(['Daily', 'Weekly']).optional(),
		marketDate: z.coerce.date().optional(),
		coverageStart: z.coerce.date().optional(),
		coverageEnd: z.coerce.date().optional(),
		heroImage: z.string().optional().nullable(),
		image: z.string().optional().nullable(), // Jekyll field
		tags: z.array(z.string()).optional().nullable(),
		relatedSlugs: z.array(z.string()).optional().nullable(),
		categories: z
			.union([z.string(), z.array(z.string())])
			.optional()
			.nullable(),
		difficulty: z.string().optional().nullable(),
		topics: z.array(z.string()).optional().nullable(),
		platform: z.string().trim().min(1).optional().nullable(),
		problemNumber: z.coerce.number().int().positive().optional().nullable(),
		ticker: etfMetadataField('ticker').optional().nullable(),
		issuer: etfMetadataField('issuer').optional().nullable(),
		assetClass: etfMetadataField('assetClass').optional().nullable(),
		strategy: etfMetadataField('strategy').optional().nullable(),
		exposure: etfMetadataField('exposure').optional().nullable(),
		leverage: etfMetadataField('leverage').optional().nullable(),
		incomeStyle: etfMetadataField('incomeStyle').optional().nullable(),
		expenseRatio: etfVolatileMetadataField,
		aum: etfVolatileMetadataField,
		yield: etfVolatileMetadataField,
		pinned: z.boolean().optional().default(false),
		draft: z.boolean().optional().default(false),
		order: z.number().optional(),
		series: z.string().optional(),
		seriesSlug: z.string().optional(),
		seriesOrder: z.number().int().nonnegative().optional(),
	}),
});

export const collections = { blog };
