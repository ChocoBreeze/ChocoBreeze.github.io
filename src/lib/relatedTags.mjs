/**
 * Counts the tags that appear alongside `tag` on the same posts.
 *
 * Most tags are used by a single post (261 of 359 on 2026-10-18), so a tag page
 * is often a dead end. Co-occurring tags give the reader somewhere to go next
 * without inventing a similarity model: it is the same metadata the tag pages
 * already show.
 *
 * Takes plain tag lists rather than posts so the ordering rules can be tested
 * without the Astro content layer.
 *
 * @param {string[][]} postTagLists one tag list per post
 * @param {string} tag the tag whose page is being rendered
 * @param {number} limit maximum number of related tags
 * @returns {{ tag: string, sharedPosts: number }[]}
 */
export function countCoOccurringTags(postTagLists = [], tag = '', limit = 8) {
	const target = String(tag ?? '').trim();
	if (!target) {
		return [];
	}

	const counts = new Map();

	for (const tags of postTagLists) {
		const normalized = (Array.isArray(tags) ? tags : [])
			.map((value) => String(value ?? '').trim())
			.filter(Boolean);
		if (!normalized.includes(target)) {
			continue;
		}

		for (const other of new Set(normalized)) {
			if (other === target) {
				continue;
			}

			counts.set(other, (counts.get(other) ?? 0) + 1);
		}
	}

	const numericLimit = Number(limit);
	const effectiveLimit =
		Number.isFinite(numericLimit) && numericLimit > 0 ? Math.floor(numericLimit) : 0;

	return [...counts.entries()]
		.map(([relatedTag, sharedPosts]) => ({ tag: relatedTag, sharedPosts }))
		.sort((a, b) => b.sharedPosts - a.sharedPosts || a.tag.localeCompare(b.tag, 'ko'))
		.slice(0, effectiveLimit);
}
