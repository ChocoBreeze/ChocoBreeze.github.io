import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import { type CollectionEntry } from 'astro:content';

const CODE_SEARCH_TEXT_LENGTH = 12000;
const CODE_FILE_EXTENSIONS = new Set([
	'.astro',
	'.c',
	'.cpp',
	'.cs',
	'.css',
	'.go',
	'.java',
	'.js',
	'.jsx',
	'.json',
	'.mjs',
	'.py',
	'.rs',
	'.sh',
	'.sql',
	'.ts',
	'.tsx',
	'.yml',
	'.yaml',
]);

const SENSITIVE_PATTERNS = [
	/sk-[A-Za-z0-9_-]{12,}/,
	/Bearer\s+[A-Za-z0-9._-]+/i,
	/file:\/\//i,
	/[A-Za-z]:\\/,
	/\/Users\//,
	/\/home\//,
	/private-user-images/i,
];

type BlogPost = CollectionEntry<'blog'>;

type CodeSearchItem = {
	t: string;
	d?: string;
	c?: string | string[] | null;
	g?: string[];
	s: string;
	f: string;
	k: 'markdown-code' | 'source-file';
	x: string;
};

function truncate(value: string) {
	return value.slice(0, CODE_SEARCH_TEXT_LENGTH).trim();
}

function isSafeCode(value: string) {
	return !SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

function getPostSlug(post: BlogPost) {
	return post.data.slug || post.id;
}

function getPostContentPath(post: BlogPost) {
	const filePath = (post as { filePath?: string }).filePath;
	if (filePath) {
		return path.resolve(filePath);
	}

	return path.join(process.cwd(), 'src', 'content', 'blog', post.id);
}

function getPostDirectory(post: BlogPost) {
	return path.dirname(getPostContentPath(post));
}

function extractMarkdownCodeBlocks(body: string) {
	const blocks: Array<{ language: string; code: string; index: number }> = [];
	const codeBlockPattern = /```([^\n`]*)\n([\s\S]*?)```/g;
	let match: RegExpExecArray | null;
	let index = 1;

	while ((match = codeBlockPattern.exec(body)) !== null) {
		const language = match[1]?.trim() || 'code';
		const code = match[2]?.trim() ?? '';

		if (code) {
			blocks.push({ language, code, index });
			index += 1;
		}
	}

	return blocks;
}

async function getSourceFiles(directory: string) {
	let entries: Dirent<string>[];

	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if (isNodeError(error) && error.code === 'ENOENT') {
			return [];
		}

		throw error;
	}

	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.filter((fileName) => CODE_FILE_EXTENSIONS.has(path.extname(fileName).toLowerCase()));
}

function isNodeError(error: unknown): error is { code?: string } {
	return typeof error === 'object' && error !== null && 'code' in error;
}

function createBaseItem(post: BlogPost) {
	return {
		t: post.data.title,
		d: post.data.description,
		c: post.data.categories,
		g: post.data.tags ?? [],
		s: getPostSlug(post),
	};
}

export async function createCodeSearchIndex(posts: BlogPost[]): Promise<CodeSearchItem[]> {
	const sourceDirectoryOwners = new Set<string>();
	const nestedItems = await Promise.all(
		posts.map(async (post) => {
			const body = (post as { body?: string }).body ?? '';
			const baseItem = createBaseItem(post);
			const items: CodeSearchItem[] = [];
			const directory = getPostDirectory(post);

			for (const block of extractMarkdownCodeBlocks(body)) {
				if (!isSafeCode(block.code)) continue;

				items.push({
					...baseItem,
					f: `Markdown code block ${block.index} (${block.language})`,
					k: 'markdown-code',
					x: truncate(block.code),
				});
			}

			if (sourceDirectoryOwners.has(directory)) {
				return items;
			}
			sourceDirectoryOwners.add(directory);

			const sourceFiles = await getSourceFiles(directory);

			for (const fileName of sourceFiles) {
				const filePath = path.join(directory, fileName);
				const code = await readFile(filePath, 'utf-8');

				if (!code.trim() || !isSafeCode(code)) continue;

				items.push({
					...baseItem,
					f: fileName,
					k: 'source-file',
					x: truncate(code),
				});
			}

			return items;
		}),
	);

	return nestedItems.flat();
}
