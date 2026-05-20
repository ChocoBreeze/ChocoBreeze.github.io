import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx', '.markdown']);
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const MAX_FUTURE_DAYS = 370;
const MAX_PAST_YEARS = 10;
const PUB_DATE_ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const ABSOLUTE_PATH_PATTERNS = [
  {
    label: 'Windows absolute path',
    regex: /(^|[\s("'`])(?:[A-Za-z]:\\|\\\\[A-Za-z0-9._ -]+\\[A-Za-z0-9._ -]+)/m,
  },
  {
    label: 'Unix absolute path',
    regex: /(^|[\s("'`])(?:\/Users\/|\/home\/|\/var\/|\/etc\/|\/opt\/|\/tmp\/)/m,
  },
  {
    label: 'file URI',
    regex: /file:\/\//i,
  },
];

const SECRET_PATTERNS = [
  {
    label: 'OpenAI API key assignment',
    regex: /OPENAI_API_KEY\s*=\s*([^\s"']+)/,
    isAllowedMatch: (match) => match[1].includes('...') || match[1].includes('<'),
  },
  {
    label: 'AWS access key',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    label: 'Bearer token with OpenAI-style key',
    regex: /Bearer\s+(sk-[A-Za-z0-9_-]{20,})/,
  },
  {
    label: 'Quoted OpenAI-style key',
    regex: /["'](sk-[A-Za-z0-9_-]{20,})["']/,
  },
];

const WARNING_PATTERNS = [
  {
    label: 'Placeholder API key example',
    regex: /OPENAI_API_KEY\s*=\s*sk-\.\.\./,
  },
  {
    label: 'Temporary hosted asset URL',
    regex: /ppl-ai-code-interpreter-files\.s3\.amazonaws\.com/i,
  },
  {
    label: 'Plain HTTP link',
    regex: /(?<![`"'])http:\/\/[^\s)>"']+/i,
  },
];

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

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function addIssue(collection, severity, filePath, line, message) {
  collection.push({
    severity,
    filePath: path.relative(ROOT_DIR, filePath),
    line,
    message,
  });
}

function findAllMatches(content, pattern) {
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  return Array.from(content.matchAll(regex));
}

function parseFrontmatterFields(frontmatter) {
  const fields = new Map();

  for (const match of frontmatter.matchAll(/^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/gm)) {
    fields.set(match[1], {
      rawValue: match[2].trim(),
      index: match.index ?? 0,
    });
  }

  return fields;
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, '');
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

  checkPubDateRange(filePath, pubDateLine, pubDateValue, warnings);
}

function stripCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, '');
}

function checkMarkdownSyntax(filePath, content, warnings) {
  const contentWithoutCode = stripCodeBlocks(content);
  const lines = contentWithoutCode.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    if (/^\s*\*{3,}\s*$/.test(line)) {
      continue;
    }

    const boldMarkerMatches = line.match(/(?<!\\)\*\*/g) ?? [];
    if (boldMarkerMatches.length % 2 !== 0) {
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

function main() {
  if (!statSync(CONTENT_DIR).isDirectory()) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = walkMarkdownFiles(CONTENT_DIR);
  const issues = [];
  const warnings = [];
  const titleIndex = new Map();

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    checkFrontmatter(filePath, content, issues, warnings, titleIndex);
    checkMarkdownSyntax(filePath, content, warnings);
    checkPatterns(filePath, content, issues, warnings);
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

  if (issues.length === 0 && warnings.length === 0) {
    console.log(`Content quality check passed for ${files.length} files.`);
    return;
  }

  for (const issue of issues) {
    console.error(`ERROR ${issue.filePath}:${issue.line} ${issue.message}`);
  }

  for (const warning of warnings) {
    console.warn(`WARN  ${warning.filePath}:${warning.line} ${warning.message}`);
  }

  if (issues.length > 0) {
    console.error(`\nContent quality check failed with ${issues.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.warn(`\nContent quality check passed with ${warnings.length} warning(s).`);
}

main();
