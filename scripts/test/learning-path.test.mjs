import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getLearningPath, getNextLearningPath } from '../../src/lib/learningPath.mjs';
import { findMissingPostReferences } from '../lib/post-reference-rules.mjs';

function post(id, options = {}) {
	return {
		id,
		filePath: options.filePath,
		data: {
			title: options.title ?? id,
			slug: options.slug,
			prerequisiteSlugs: options.prerequisiteSlugs,
			draft: options.draft ?? false,
		},
	};
}

describe('getLearningPath', () => {
	it('resolves ordered prerequisites by slug and source path', () => {
		const first = post('first', { slug: 'first-post' });
		const second = post('second', { filePath: 'src/content/blog/Programming/Second Post.md' });
		const current = post('current', {
			prerequisiteSlugs: ['first-post', 'Programming/Second Post.md'],
		});

		assert.deepEqual(getLearningPath({ posts: [current, first, second], currentPost: current }), [
			{ id: 'first', title: 'first', href: '/blog/first-post/' },
			{ id: 'second', title: 'second', href: '/blog/second/' },
		]);
	});

	it('omits missing, draft, duplicate, and self references', () => {
		const published = post('published', { slug: 'published' });
		const draft = post('draft', { slug: 'draft', draft: true });
		const current = post('current', {
			slug: 'current',
			prerequisiteSlugs: ['published', 'published', 'draft', 'current', 'missing'],
		});

		assert.deepEqual(
			getLearningPath({ posts: [current, published, draft], currentPost: current }),
			[{ id: 'published', title: 'published', href: '/blog/published/' }],
		);
	});
});

describe('getNextLearningPath', () => {
	it('resolves one-hop dependents by slug and source path with a limit', () => {
		const current = post('current', {
			slug: 'current-post',
			filePath: 'src/content/blog/Programming/Current Post.md',
		});
		const bySlug = post('by-slug', {
			prerequisiteSlugs: ['current-post'],
		});
		const byPath = post('by-path', {
			prerequisiteSlugs: ['Programming/Current Post.md'],
		});
		const overLimit = post('over-limit', {
			prerequisiteSlugs: ['current-post'],
		});

		assert.deepEqual(
			getNextLearningPath({
				posts: [current, bySlug, byPath, overLimit],
				currentPost: current,
				limit: 2,
			}),
			[
				{ id: 'by-slug', title: 'by-slug', href: '/blog/by-slug/' },
				{ id: 'by-path', title: 'by-path', href: '/blog/by-path/' },
			],
		);
	});

	it('omits drafts and the current post from reverse edges', () => {
		const current = post('current', { slug: 'current' });
		const draft = post('draft', { draft: true, prerequisiteSlugs: ['current'] });
		const self = post('self', { slug: 'self', prerequisiteSlugs: ['self'] });

		assert.deepEqual(
			getNextLearningPath({ posts: [current, draft, self], currentPost: current }),
			[],
		);
		assert.deepEqual(
			getNextLearningPath({
				posts: [current],
				currentPost: { ...current, data: { ...current.data, draft: true } },
			}),
			[],
		);
	});
});

describe('content check prerequisite validation', () => {
	it('finds unknown prerequisite references without touching the content directory', () => {
		const frontmatter = 'prerequisiteSlugs: [known-post, missing-prerequisite]';
		const knownPostReferences = new Set(['known-post']);

		assert.deepEqual(
			findMissingPostReferences(frontmatter, 'prerequisiteSlugs', knownPostReferences),
			['missing-prerequisite'],
		);
	});
});
