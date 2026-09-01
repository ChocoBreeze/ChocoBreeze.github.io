import { normalizePostReference } from '../../src/lib/postReferences.mjs';

import { parseFrontmatterListField } from './content-rules.mjs';

/**
 * Return references from a frontmatter list that do not resolve to a known post.
 *
 * The checker uses this pure helper so reference validation can be tested
 * without creating temporary files in the shared content directory.
 */
export function findMissingPostReferences(frontmatter, fieldName, postReferences) {
	return parseFrontmatterListField(frontmatter, fieldName).filter(
		(reference) => !postReferences.has(normalizePostReference(reference)),
	);
}
