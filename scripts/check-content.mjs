import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx', '.markdown']);
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
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

function checkFrontmatter(filePath, content, issues) {
  const frontmatterMatch = content.match(FRONTMATTER_REGEX);
  if (!frontmatterMatch) {
    addIssue(issues, 'error', filePath, 1, 'Missing frontmatter block.');
    return;
  }

  const frontmatter = frontmatterMatch[1];
  const pubDateMatch = frontmatter.match(/(?:^|\r?\n)pubDate:\s*(.+)/);
  const dateMatch = frontmatter.match(/(?:^|\r?\n)date:\s*(.+)/);

  if (!pubDateMatch && !dateMatch) {
    addIssue(issues, 'error', filePath, 1, 'Missing `pubDate` or legacy `date` in frontmatter.');
    return;
  }

  if (!pubDateMatch && dateMatch) {
    return;
  }

  const rawValue = pubDateMatch[1].trim();
  const pubDateValue = rawValue.replace(/^['"]|['"]$/g, '');
  const pubDateLine = getLineNumber(content, frontmatterMatch.index + pubDateMatch.index);

  if (!PUB_DATE_ISO_REGEX.test(pubDateValue)) {
    addIssue(
      issues,
      'error',
      filePath,
      pubDateLine,
      `Invalid pubDate format: ${rawValue}. Use full ISO 8601 with timezone, e.g. "2026-01-16T00:00:00+09:00".`,
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

function main() {
  if (!statSync(CONTENT_DIR).isDirectory()) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = walkMarkdownFiles(CONTENT_DIR);
  const issues = [];
  const warnings = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    checkFrontmatter(filePath, content, issues);
    checkPatterns(filePath, content, issues, warnings);
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
