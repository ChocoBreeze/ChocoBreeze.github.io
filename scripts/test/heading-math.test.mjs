import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import rehypeHeadingMath from '../../src/lib/rehypeHeadingMath.mjs';

const text = (value) => ({ type: 'text', value });
const element = (tagName, properties, children) => ({
	type: 'element',
	tagName,
	properties,
	children,
});

// Minimal shape of rehype-katex output: MathML with a TeX annotation, plus HTML glyphs.
function katex(tex, glyphs) {
	return element('span', { className: ['katex'] }, [
		element('span', { className: ['katex-mathml'] }, [
			element('math', {}, [
				element('semantics', {}, [
					element('mi', {}, [text(glyphs)]),
					element('annotation', { encoding: 'application/x-tex' }, [text(tex)]),
				]),
			]),
		]),
		element('span', { className: ['katex-html'], ariaHidden: 'true' }, [text(glyphs)]),
	]);
}

function run(children) {
	const tree = { type: 'root', children };
	const file = { data: {} };
	rehypeHeadingMath()(tree, file);
	return { tree, labels: file.data.astro?.frontmatter?.tocLabels };
}

describe('rehypeHeadingMath', () => {
	it('gives a math heading a readable id and an HTML TOC label', () => {
		const heading = element('h3', {}, [
			text('(2) 거리: '),
			katex('\\lceil \\tfrac{d_1}{2} \\rceil', '⌈d1⌉'),
		]);

		const { labels } = run([heading]);

		assert.equal(heading.properties.id, '2-거리-lceil-tfracd_12-rceil');
		assert.ok(labels[heading.properties.id].startsWith('(2) 거리: <span class="katex">'));
	});

	it('unwraps other inline formatting in the label', () => {
		const heading = element('h2', {}, [
			element('strong', {}, [text('방법 <A> '), katex('O(n)', 'O(n)')]),
		]);

		const { labels } = run([heading]);

		assert.ok(labels[heading.properties.id].startsWith('방법 &#x3C;A> <span class="katex">'));
		assert.ok(!labels[heading.properties.id].includes('<strong>'));
	});

	it('leaves headings without math to Astro', () => {
		const heading = element('h2', {}, [text('개요')]);

		const { labels } = run([heading]);

		assert.equal(heading.properties.id, undefined);
		assert.equal(labels, undefined);
	});

	it('keeps an id that is already set', () => {
		const heading = element('h2', { id: 'custom' }, [katex('x^2', 'x2')]);

		const { labels } = run([heading]);

		assert.equal(heading.properties.id, 'custom');
		assert.ok(labels.custom);
	});
});
