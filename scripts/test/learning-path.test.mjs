import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getLearningPath } from '../../src/lib/learningPath.mjs';
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
