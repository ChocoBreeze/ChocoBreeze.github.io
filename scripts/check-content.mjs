import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  ABSOLUTE_PATH_PATTERNS,
  FINANCE_CATEGORIES_FOR_DELIMITER_CHECK,
  FRONTMATTER_REGEX,
  KNOWN_CATEGORIES,
  MARKDOWN_IMAGE_REGEX,
  MARKDOWN_LINK_REGEX,
  MAX_DESCRIPTION_LENGTH,
  MAX_FUTURE_DAYS,
  MAX_PAST_YEARS,
  MAX_TITLE_LENGTH,
  PUB_DATE_ISO_REGEX,
  SECRET_PATTERNS,
  UNSAFE_SLUG_REGEX,
  WARNING_PATTERNS,
  countMathDelimiters,
  findAllMatches,
  getComparableLinkTarget,
  getLineNumber,
  getPrimaryCategory,
  hasUnbalancedBold,
  normalizeCategoryValue,
  normalizeRoutePath,
  parseFrontmatterFields,
  parseFrontmatterListValue,
  shouldCheckInternalLink,
  slugifyPathSegment,
  stripCodeBlocks,
  stripInlineCode,
  stripQuotes,
} from './lib/content-rules.mjs';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function walkMarkdownFiles(directory) {
  const results = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(fullPath));
      continue;
    }

    if (MARKDOWN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }

  return results;
}

function addIssue(collection, severity, filePath, line, message) {
  collection.push({
    severity,
    filePath: path.relative(ROOT_DIR, filePath),
    line,
    message,
  });
}

function getPostRoutePath(filePath, content) {
  const frontmatterMatch = content.match(FRONTMATTER_REGEX);
  const fields = frontmatterMatch ? parseFrontmatterFields(frontmatterMatch[1]) : new Map();
  const slugField = fields.get('slug');

  if (slugField) {
    return normalizeRoutePath(`/blog/${stripQuotes(slugField.rawValue)}`);
  }

  const relativePath = path.relative(CONTENT_DIR, filePath);
  const parsedPath = path.parse(relativePath);
  const relativeWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
  const slugPath = relativeWithoutExtension
    .split(path.sep)
    .filter(Boolean)
    .map(slugifyPathSegment)
    .join('/');

  return normalizeRoutePath(`/blog/${slugPath}`);
}

function buildPostRouteIndex(files) {
  const routes = new Map();

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    const routePath = getPostRoutePath(filePath, content);
    const entries = routes.get(routePath) ?? [];
    entries.push(filePath);
    routes.set(routePath, entries);
  }

  return routes;
}

function checkRequiredFrontmatterField(filePath, content, frontmatterMatch, fields, fieldName, issues) {
  const field = fields.get(fieldName);
  if (!field || stripQuotes(field.rawValue).trim().length === 0) {
    addIssue(
      issues,
      'error',
      filePath,
      getLineNumber(content, frontmatterMatch.index),
      `Missing required frontmatter field: \`${fieldName}\`.`,
    );
  }
}

function checkRecommendedFrontmatterField(filePath, content, frontmatterMatch, fields, fieldName, warnings) {
  const field = fields.get(fieldName);
  if (!field || stripQuotes(field.rawValue).trim().length === 0) {
    addIssue(
      warnings,
      'warning',
      filePath,
      getLineNumber(content, frontmatterMatch.index),
      `Missing recommended frontmatter field: \`${fieldName}\`.`,
    );
  }
}

function checkPubDateRange(filePath, line, pubDateValue, warnings) {
  const pubDate = new Date(pubDateValue);
  if (Number.isNaN(pubDate.getTime())) {
    return;
  }

  const now = new Date();
  const maxFutureDate = new Date(now);
  maxFutureDate.setDate(maxFutureDate.getDate() + MAX_FUTURE_DAYS);

  const minPastDate = new Date(now);
  minPastDate.setFullYear(minPastDate.getFullYear() - MAX_PAST_YEARS);

  if (pubDate > maxFutureDate) {
    addIssue(
      warnings,
      'warning',
      filePath,
      line,
      `pubDate is more than ${MAX_FUTURE_DAYS} days in the future.`,
    );
  }

  if (pubDate < minPastDate) {
    addIssue(
      warnings,
      'warning',
      filePath,
      line,
      `pubDate is more than ${MAX_PAST_YEARS} years in the past.`,
    );
  }
}

function checkDateFieldFormat(filePath, content, frontmatterMatch, fields, fieldName, issues) {
  const field = fields.get(fieldName);
  if (!field) {
    return;
  }

  const rawValue = field.rawValue;
  const value = stripQuotes(rawValue);
  const line = getLineNumber(content, frontmatterMatch.index + field.index);

  if (!PUB_DATE_ISO_REGEX.test(value)) {
    addIssue(
      issues,
      'error',
      filePath,
      line,
      `Invalid ${fieldName} format: ${rawValue}. Use full ISO 8601 with timezone, e.g. "2026-01-16T00:00:00+09:00".`,
    );
  }
}

function checkCategories(filePath, content, frontmatterMatch, fields, warnings) {
  const categoryField = fields.get('categories');
  if (!categoryField) {
    return;
  }

  const categories = parseFrontmatterListValue(categoryField.rawValue);
  const categoryLine = getLineNumber(content, frontmatterMatch.index + categoryField.index);

  for (const category of categories) {
    const normalizedCategory = normalizeCategoryValue(category);
    if (KNOWN_CATEGORIES.has(normalizedCategory)) {
      continue;
    }

    addIssue(
      warnings,
      'warning',
      filePath,
      categoryLine,
      `Unknown category "${category}". It will not match a configured category page.`,
    );
  }
}

function checkFrontmatterTextLength(filePath, content, frontmatterMatch, fields, fieldName, maxLength, warnings) {
  const field = fields.get(fieldName);
  if (!field) {
    return;
  }

  const value = stripQuotes(field.rawValue).trim();
  if (value.length <= maxLength) {
    return;
  }

  addIssue(
    warnings,
    'warning',
    filePath,
    getLineNumber(content, frontmatterMatch.index + field.index),
    `${fieldName} is ${value.length} characters. Keep it under ${maxLength} characters for readable cards and previews.`,
  );
}

function checkSlug(filePath, content, frontmatterMatch, fields, warnings) {
  const field = fields.get('slug');
  if (!field) {
    return;
  }

  const value = stripQuotes(field.rawValue).trim();
  if (!value || !UNSAFE_SLUG_REGEX.test(value)) {
    return;
  }

  addIssue(
    warnings,
    'warning',
    filePath,
    getLineNumber(content, frontmatterMatch.index + field.index),
    `Slug contains whitespace, backslashes, query markers, or hash markers: ${field.rawValue}.`,
  );
}

function checkFrontmatter(filePath, content, issues, warnings, titleIndex) {
  const frontmatterMatch = content.match(FRONTMATTER_REGEX);
  if (!frontmatterMatch) {
    addIssue(issues, 'error', filePath, 1, 'Missing frontmatter block.');
    return;
  }

  const frontmatter = frontmatterMatch[1];
  const fields = parseFrontmatterFields(frontmatter);
  const pubDateField = fields.get('pubDate');
  const dateField = fields.get('date');

  checkRequiredFrontmatterField(filePath, content, frontmatterMatch, fields, 'title', issues);
  checkRecommendedFrontmatterField(filePath, content, frontmatterMatch, fields, 'categories', warnings);
  checkFrontmatterTextLength(filePath, content, frontmatterMatch, fields, 'title', MAX_TITLE_LENGTH, warnings);
  checkFrontmatterTextLength(
    filePath,
    content,
    frontmatterMatch,
    fields,
    'description',
    MAX_DESCRIPTION_LENGTH,
    warnings,
  );
  checkSlug(filePath, content, frontmatterMatch, fields, warnings);
  checkCategories(filePath, content, frontmatterMatch, fields, warnings);

  const titleField = fields.get('title');
  if (titleField) {
    const title = stripQuotes(titleField.rawValue).trim();
    if (title) {
      const titleLine = getLineNumber(content, frontmatterMatch.index + titleField.index);
      const existing = titleIndex.get(title) ?? [];
      existing.push({ filePath, line: titleLine });
      titleIndex.set(title, existing);
    }
  }

  if (!pubDateField && !dateField) {
    addIssue(issues, 'error', filePath, 1, 'Missing `pubDate` or legacy `date` in frontmatter.');
    return;
  }

  if (!pubDateField && dateField) {
    return;
  }

  const rawValue = pubDateField.rawValue;
  const pubDateValue = stripQuotes(rawValue);
  const pubDateLine = getLineNumber(content, frontmatterMatch.index + pubDateField.index);

  if (!PUB_DATE_ISO_REGEX.test(pubDateValue)) {
    addIssue(
      issues,
      'error',
      filePath,
      pubDateLine,
      `Invalid pubDate format: ${rawValue}. Use full ISO 8601 with timezone, e.g. "2026-01-16T00:00:00+09:00".`,
    );
    return;
  }

  checkDateFieldFormat(filePath, content, frontmatterMatch, fields, 'updatedDate', issues);
  checkPubDateRange(filePath, pubDateLine, pubDateValue, warnings);
}

function checkMarkdownSyntax(filePath, content, warnings) {
  const contentWithoutCode = stripCodeBlocks(content);
  const lines = contentWithoutCode.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    if (hasUnbalancedBold(line)) {
      addIssue(
        warnings,
        'warning',
        filePath,
        index + 1,
        'Unbalanced bold markdown marker `**` detected.',
      );
    }
  }

  for (const tag of ['strong', 'em', 'b', 'i']) {
    const openingCount = findAllMatches(contentWithoutCode, new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'i')).length;
    const closingCount = findAllMatches(contentWithoutCode, new RegExp(`</${tag}>`, 'i')).length;

    if (openingCount !== closingCount) {
      addIssue(
        warnings,
        'warning',
        filePath,
        1,
        `Unbalanced HTML tag detected: <${tag}>.`,
      );
    }
  }
}

function checkMathStrikethroughCollisions(filePath, content, warnings) {
  const contentWithoutCode = stripInlineCode(stripCodeBlocks(content));
  const lines = contentWithoutCode.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const { dollar: dollarCount, tilde: tildeCount } = countMathDelimiters(line);

    if (dollarCount >= 2) {
      addIssue(
        warnings,
        'warning',
        filePath,
        index + 1,
        `Line has ${dollarCount} unescaped "$" characters; remark-math may parse text between a pair of them as inline math. Escape currency figures as "\\$" if not intentional math.`,
      );
    }

    if (tildeCount >= 2) {
      addIssue(
        warnings,
        'warning',
        filePath,
        index + 1,
        `Line has ${tildeCount} unescaped "~" characters; GFM may parse text between a pair of them as strikethrough. Escape range separators as "\\~" if not intentional strikethrough.`,
      );
    }
  }
}

function checkImages(filePath, content, warnings) {
  const contentWithoutCode = stripCodeBlocks(content);

  for (const match of findAllMatches(contentWithoutCode, MARKDOWN_IMAGE_REGEX)) {
    const altText = match[1].trim();
    if (altText) {
      continue;
    }

    addIssue(
      warnings,
      'warning',
      filePath,
      getLineNumber(contentWithoutCode, match.index ?? 0),
      `Markdown image is missing alt text: ${match[2]}.`,
    );
  }
}

function checkPatterns(filePath, content, issues, warnings) {
  for (const pattern of ABSOLUTE_PATH_PATTERNS) {
    const match = content.match(pattern.regex);
    if (!match) {
      continue;
    }

    addIssue(
      issues,
      'error',
      filePath,
      getLineNumber(content, match.index ?? 0),
      `${pattern.label} detected in content.`,
    );
  }

  for (const pattern of SECRET_PATTERNS) {
    for (const match of findAllMatches(content, pattern.regex)) {
      if (pattern.isAllowedMatch?.(match)) {
        continue;
      }

      addIssue(
        issues,
        'error',
        filePath,
        getLineNumber(content, match.index ?? 0),
        `${pattern.label} detected.`,
      );
    }
  }

  for (const pattern of WARNING_PATTERNS) {
    for (const match of findAllMatches(content, pattern.regex)) {
      addIssue(
        warnings,
        'warning',
        filePath,
        getLineNumber(content, match.index ?? 0),
        `${pattern.label} detected.`,
      );
    }
  }
}

function resolveInternalLinkTarget(filePath, href) {
  const target = getComparableLinkTarget(href);
  if (!target) {
    return undefined;
  }

  if (target.startsWith('/')) {
    return path.join(PUBLIC_DIR, target);
  }

  return path.resolve(path.dirname(filePath), target);
}

function checkInternalLinks(filePath, content, warnings, postRoutes) {
  const contentWithoutCode = stripCodeBlocks(content);

  for (const match of findAllMatches(contentWithoutCode, MARKDOWN_LINK_REGEX)) {
    const href = match[1];
    if (!shouldCheckInternalLink(href)) {
      continue;
    }

    const routePath = normalizeRoutePath(href);
    if (routePath.startsWith('/blog/') && postRoutes.has(routePath)) {
      continue;
    }

    const targetPath = resolveInternalLinkTarget(filePath, href);
    if (!targetPath || existsSync(targetPath)) {
      continue;
    }

    addIssue(
      warnings,
      'warning',
      filePath,
      getLineNumber(contentWithoutCode, match.index ?? 0),
      `Internal link target not found: ${href}.`,
    );
  }
}

function checkDuplicatePostRoutes(postRoutes, issues) {
  for (const [routePath, filePaths] of postRoutes) {
    if (filePaths.length < 2) {
      continue;
    }

    for (const filePath of filePaths) {
      addIssue(
        issues,
        'error',
        filePath,
        1,
        `Duplicate generated post route detected: ${routePath}.`,
      );
    }
  }
}

function getStagedFileSet() {
  const listArg = process.argv.find((arg) => arg.startsWith('--staged-file-list='));
  if (!listArg) {
    return null;
  }

  const listPath = listArg.slice('--staged-file-list='.length);
  const raw = readFileSync(listPath, 'utf8');
  return new Set(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/\\/g, '/'))
      .filter(Boolean),
  );
}

function main() {
  if (!statSync(CONTENT_DIR).isDirectory()) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const stagedFileSet = getStagedFileSet();
  const files = walkMarkdownFiles(CONTENT_DIR);
  const issues = [];
  const warnings = [];
  const titleIndex = new Map();
  const postRoutes = buildPostRouteIndex(files);

  checkDuplicatePostRoutes(postRoutes, issues);

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    checkFrontmatter(filePath, content, issues, warnings, titleIndex);
    checkMarkdownSyntax(filePath, content, warnings);
    if (FINANCE_CATEGORIES_FOR_DELIMITER_CHECK.has(getPrimaryCategory(content))) {
      checkMathStrikethroughCollisions(filePath, content, warnings);
    }
    checkImages(filePath, content, warnings);
    checkPatterns(filePath, content, issues, warnings);
    checkInternalLinks(filePath, content, warnings, postRoutes);
  }

  for (const [title, entries] of titleIndex) {
    if (entries.length < 2) {
      continue;
    }

    for (const entry of entries) {
      addIssue(
        warnings,
        'warning',
        entry.filePath,
        entry.line,
        `Duplicate post title detected: "${title}".`,
      );
    }
  }

  // Errors always apply repo-wide (correctness must always hold). Warnings are
  // noisier and lower-stakes, so when a staged-file list is provided (from the
  // pre-commit hook) only surface warnings for files actually being committed —
  // otherwise every commit re-prints warnings for the entire legacy corpus.
  const reportedWarnings = stagedFileSet
    ? warnings.filter((warning) => stagedFileSet.has(warning.filePath.replace(/\\/g, '/')))
    : warnings;

  if (issues.length === 0 && reportedWarnings.length === 0) {
    console.log(`Content quality check passed for ${files.length} files.`);
    return;
  }

  for (const issue of issues) {
    console.error(`ERROR ${issue.filePath}:${issue.line} ${issue.message}`);
  }

  for (const warning of reportedWarnings) {
    console.warn(`WARN  ${warning.filePath}:${warning.line} ${warning.message}`);
  }

  if (issues.length > 0) {
    console.error(
      `\nContent quality check failed with ${issues.length} error(s) and ${reportedWarnings.length} warning(s).`,
    );
    process.exit(1);
  }

  console.warn(`\nContent quality check passed with ${reportedWarnings.length} warning(s).`);
}

main();
