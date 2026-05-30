import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');

const CATEGORY_FOLDERS = {
  ETF: 'ETF',
  Economics: 'Economics',
  Semiconductor: 'Semiconductor',
  'Computer Science': 'Computer Science',
  Programming: 'Programming',
  Problem_Solving: 'Problem Solving',
  Reports: 'Reports',
  'Market Brief': 'Market Brief',
};

function printHelp() {
  console.log(`Usage:
  npm run new:post -- --title "Post title" --category Programming --date 2026-05-30 --slug programming/my-post
  npm run new:post -- --type market-daily --date 2026-05-30
  npm run new:post -- --type market-weekly --date 2026-05-30

Options:
  --type       generic, market-daily, market-weekly. Default: generic
  --title      Post title. Auto-generated for market-daily and market-weekly.
  --category   Category key or name. Default: Programming
  --date       Publish date in YYYY-MM-DD. Default: today
  --slug       Stable blog slug. Recommended for generic posts.
  --file       Output file path under src/content/blog.
  --help       Show this help message.`);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    if (key === 'help') {
      args.help = true;
      continue;
    }

    args[key] = argv[index + 1];
    index += 1;
  }

  return args;
}

function getDateParts(dateValue) {
  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid --date value: ${dateValue}. Use YYYY-MM-DD.`);
  }

  const [, year, month, day] = match;
  return {
    year,
    month,
    day,
    shortYear: year.slice(2),
    monthNumber: Number(month),
    dayNumber: Number(day),
    yymm: `${year.slice(2)}${month}`,
    yymmFolder: `${year.slice(2)}.${month}`,
    yymmdd: `${year.slice(2)}${month}${day}`,
  };
}

function getTodayInSeoul() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date());
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[ \t]+/g, '-')
    .replace(/[()[\]{}]/g, '')
    .replace(/[&+]/g, '-')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCategory(category) {
  if (CATEGORY_FOLDERS[category]) {
    return category;
  }

  const normalized = Object.keys(CATEGORY_FOLDERS).find(
    (key) => key.toLowerCase() === category.toLowerCase(),
  );

  if (!normalized) {
    throw new Error(`Unknown category: ${category}`);
  }

  return normalized;
}

function getMarketBriefDefaults(type, dateParts) {
  const reportType = type === 'market-weekly' ? 'Weekly' : 'Daily';

  return {
    title: `20${dateParts.shortYear}년 ${dateParts.monthNumber}월 ${dateParts.dayNumber}일 ${reportType} Brief`,
    description:
      reportType === 'Weekly'
        ? '이번 주 미국 주식시장과 주요 투자 테마 흐름을 정리합니다.'
        : '전일 미국 주식시장 마감 흐름과 주요 섹터·스타일 변화를 정리합니다.',
    category: 'Market Brief',
    slug: `market-brief/${dateParts.yymm}/${dateParts.yymmdd}-${reportType.toLowerCase()}`,
    file: path.join('Market Brief', dateParts.yymmFolder, `${dateParts.yymmdd} ${reportType}.md`),
  };
}

function buildPostContent({ title, description, category, slug, date }) {
  return `---
title: "${title}"
description: "${description}"
pubDate: "${date}T00:00:00+09:00"
categories: "${category}"
slug: "${slug}"
---

## 핵심 요약

- 

## 본문

내용을 작성합니다.

## 참고

- 
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const type = args.type ?? 'generic';
  const date = args.date ?? getTodayInSeoul();
  const dateParts = getDateParts(date);
  const defaults = type.startsWith('market-') ? getMarketBriefDefaults(type, dateParts) : {};
  const category = normalizeCategory(args.category ?? defaults.category ?? 'Programming');
  const title = args.title ?? defaults.title;

  if (!title) {
    throw new Error('Missing --title for generic post.');
  }

  const description = args.description ?? defaults.description ?? '글 내용을 한 문장으로 요약합니다.';
  const slug = args.slug ?? defaults.slug ?? `${slugify(category)}/${slugify(title)}`;
  const categoryFolder = CATEGORY_FOLDERS[category];
  const relativeFile =
    args.file ?? defaults.file ?? path.join(categoryFolder, `${date} ${slugify(title)}.md`);
  const outputPath = path.join(CONTENT_DIR, relativeFile);

  if (existsSync(outputPath)) {
    throw new Error(`Post already exists: ${path.relative(ROOT_DIR, outputPath)}`);
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    buildPostContent({
      title,
      description,
      category,
      slug,
      date,
    }),
    'utf8',
  );

  console.log(`Created ${path.relative(ROOT_DIR, outputPath)}`);
}

main();
