import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  countMathDelimiters,
  getPrimaryCategory,
  hasUnbalancedBold,
  isKnownCategory,
  isValidDateFieldFormat,
  normalizeCategoryValue,
  normalizeRoutePath,
  parseFrontmatterFields,
  parseFrontmatterListValue,
  shouldCheckInternalLink,
  slugifyPathSegment,
  stripCodeBlocks,
  stripQuotes,
} from '../lib/content-rules.mjs';

describe('isValidDateFieldFormat', () => {
  it('accepts full ISO 8601 with timezone offset', () => {
    assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00+09:00'), true);
  });

  it('accepts UTC Z and fractional seconds', () => {
    assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00Z'), true);
    assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00.123+09:00'), true);
  });

  it('accepts quoted values (frontmatter quoting is stripped)', () => {
    assert.equal(isValidDateFieldFormat('"2026-01-16T00:00:00+09:00"'), true);
  });

  it('rejects a date without a timezone', () => {
    assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00'), false);
  });

  it('rejects a bare date', () => {
    assert.equal(isValidDateFieldFormat('2026-01-16'), false);
  });
});

describe('normalizeCategoryValue / isKnownCategory', () => {
  it('maps known aliases to canonical keys', () => {
    assert.equal(normalizeCategoryValue('cs'), 'Computer Science');
    assert.equal(normalizeCategoryValue('problem solving'), 'Problem_Solving');
    assert.equal(normalizeCategoryValue('macro'), 'Economics');
    assert.equal(normalizeCategoryValue('US Market Brief'), 'Market Brief');
  });

  it('is case-insensitive for aliases', () => {
    assert.equal(normalizeCategoryValue('ETF'), 'ETF');
    assert.equal(normalizeCategoryValue('etf'), 'ETF');
  });

  it('passes canonical keys through unchanged', () => {
    assert.equal(normalizeCategoryValue('Semiconductor'), 'Semiconductor');
  });

  it('leaves unknown values as trimmed input', () => {
    assert.equal(normalizeCategoryValue('  Cooking '), 'Cooking');
    assert.equal(isKnownCategory('Cooking'), false);
  });

  it('recognizes known categories through aliases', () => {
    assert.equal(isKnownCategory('cs'), true);
    assert.equal(isKnownCategory('Market Brief'), true);
  });
});

describe('parseFrontmatterFields', () => {
  it('extracts simple key/value pairs', () => {
    const fields = parseFrontmatterFields('title: Hello\npubDate: 2026-01-16T00:00:00+09:00');
    assert.equal(fields.get('title').rawValue, 'Hello');
    assert.equal(fields.get('pubDate').rawValue, '2026-01-16T00:00:00+09:00');
  });

  it('ignores indented (nested) keys', () => {
    const fields = parseFrontmatterFields('title: Hello\n  nested: value');
    assert.equal(fields.has('nested'), false);
  });
});

describe('parseFrontmatterListValue', () => {
  it('parses an inline array', () => {
    assert.deepEqual(parseFrontmatterListValue('[ETF, "Market Brief"]'), ['ETF', 'Market Brief']);
  });

  it('parses a single scalar value', () => {
    assert.deepEqual(parseFrontmatterListValue('Programming'), ['Programming']);
  });

  it('returns an empty array for blank input', () => {
    assert.deepEqual(parseFrontmatterListValue('   '), []);
  });
});

describe('stripQuotes', () => {
  it('removes matching surrounding quotes', () => {
    assert.equal(stripQuotes('"value"'), 'value');
    assert.equal(stripQuotes("'value'"), 'value');
  });

  it('leaves unquoted values untouched', () => {
    assert.equal(stripQuotes('value'), 'value');
  });
});

describe('slugifyPathSegment', () => {
  it('lowercases and dash-collapses spaces and specials', () => {
    assert.equal(slugifyPathSegment('My Post (v2)'), 'my-post-v2');
  });

  it('preserves Korean characters', () => {
    assert.equal(slugifyPathSegment('반도체 기초'), '반도체-기초');
  });

  it('trims leading and trailing dashes', () => {
    assert.equal(slugifyPathSegment('  & hello & '), 'hello');
  });
});

describe('normalizeRoutePath', () => {
  it('strips trailing slashes and query/hash', () => {
    assert.equal(normalizeRoutePath('/blog/foo/'), '/blog/foo');
    assert.equal(normalizeRoutePath('/blog/foo?x=1#y'), '/blog/foo');
  });

  it('adds a leading slash when missing', () => {
    assert.equal(normalizeRoutePath('blog/foo'), '/blog/foo');
  });

  it('collapses an empty path to root', () => {
    assert.equal(normalizeRoutePath('/'), '/');
  });
});

describe('shouldCheckInternalLink', () => {
  it('skips external, protocol, and anchor links', () => {
    assert.equal(shouldCheckInternalLink('https://example.com'), false);
    assert.equal(shouldCheckInternalLink('mailto:a@b.com'), false);
    assert.equal(shouldCheckInternalLink('#section'), false);
    assert.equal(shouldCheckInternalLink('//cdn.example.com/x'), false);
  });

  it('checks absolute, relative, and file-extension links', () => {
    assert.equal(shouldCheckInternalLink('/images/x.png'), true);
    assert.equal(shouldCheckInternalLink('./sibling'), true);
    assert.equal(shouldCheckInternalLink('diagram.svg'), true);
  });
});

describe('stripCodeBlocks', () => {
  it('blanks fenced code content while preserving line count', () => {
    const input = 'a\n```\n$secret$\n```\nb';
    const output = stripCodeBlocks(input);
    assert.equal(output.split('\n').length, input.split('\n').length);
    assert.equal(output.includes('$secret$'), false);
    assert.equal(output.startsWith('a\n'), true);
    assert.equal(output.endsWith('\nb'), true);
  });
});

describe('hasUnbalancedBold', () => {
  it('flags an odd number of ** markers', () => {
    assert.equal(hasUnbalancedBold('this is **bold without close'), true);
  });

  it('accepts a balanced pair', () => {
    assert.equal(hasUnbalancedBold('this is **bold** text'), false);
  });

  it('ignores a horizontal rule of asterisks', () => {
    assert.equal(hasUnbalancedBold('***'), false);
  });

  it('ignores escaped markers', () => {
    assert.equal(hasUnbalancedBold('price is 2 \\**stars'), false);
  });
});

describe('countMathDelimiters', () => {
  it('counts unescaped dollar signs as inline-math risk', () => {
    assert.equal(countMathDelimiters('from $10 to $20').dollar, 2);
  });

  it('does not count escaped currency', () => {
    assert.equal(countMathDelimiters('from \\$10 to \\$20').dollar, 0);
  });

  it('ignores block math spans', () => {
    assert.equal(countMathDelimiters('inline $$x + y$$ done').dollar, 0);
  });

  it('counts tildes as strikethrough risk and ignores ~~spans~~', () => {
    assert.equal(countMathDelimiters('range 1~5 and 6~9').tilde, 2);
    assert.equal(countMathDelimiters('~~struck~~ text').tilde, 0);
  });
});

describe('getPrimaryCategory', () => {
  it('returns the normalized first category from frontmatter', () => {
    const content = '---\ntitle: X\ncategories: [cs, Programming]\n---\nbody';
    assert.equal(getPrimaryCategory(content), 'Computer Science');
  });

  it('returns undefined when there is no frontmatter', () => {
    assert.equal(getPrimaryCategory('no frontmatter here'), undefined);
  });

  it('returns undefined when categories are absent', () => {
    assert.equal(getPrimaryCategory('---\ntitle: X\n---\nbody'), undefined);
  });
});
