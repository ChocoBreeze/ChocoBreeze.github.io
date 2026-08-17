import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const CODEX_TRAILER = 'Co-authored-by: Codex <noreply@openai.com>';
const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_HOOKS_PATH = path.resolve(TEST_DIR, 'fixtures', 'global-hooks');
const EXACT_CODEX_TRAILERS = [
	'AI-Agent: Codex',
	'AI-Model: gpt-5.6-luna',
	'AI-Reasoning: xhigh',
	CODEX_TRAILER,
].join('\n');
const PARTIAL_CODEX_TRAILERS = [
	'AI-Agent: Codex',
	'AI-Model: GPT-5',
	'AI-Reasoning: unknown',
	CODEX_TRAILER,
].join('\n');
const UNKNOWN_CODEX_TRAILERS = [
	'AI-Agent: Codex',
	'AI-Model: unknown',
	'AI-Reasoning: unknown',
	CODEX_TRAILER,
].join('\n');
const VALID_CLAUDE_TRAILERS = [
	'AI-Agent: Claude Code',
	'AI-Model: test-model',
	'AI-Reasoning: high',
	'Co-authored-by: Claude Code <noreply@example.com>',
].join('\n');

function buildEnvironment({ env: envOverrides = {} } = {}) {
	const env = { ...process.env, ...envOverrides };
	delete env.AI_MODEL;
	return env;
}

function runGitResult(cwd, args, options = {}) {
	const { input, ...environmentOptions } = options;
	return spawnSync('git', args, {
		cwd,
		encoding: 'utf8',
		env: buildEnvironment(environmentOptions),
		...(input === undefined ? {} : { input }),
	});
}

function runGit(cwd, args, options = {}) {
	const result = runGitResult(cwd, args, options);

	assert.equal(
		result.status,
		0,
		'git ' + args.join(' ') + ' failed:\n' + result.stdout + '\n' + result.stderr,
	);

	return result.stdout;
}

function withRepository(callback) {
	const directory = mkdtempSync(path.join(tmpdir(), 'chocobreeze-hook-test-'));

	try {
		runGit(directory, ['init', '--quiet']);
		runGit(directory, ['config', 'user.name', 'Hook Test']);
		runGit(directory, ['config', 'user.email', 'hook-test@example.com']);
		callback(directory, { env: createGlobalConfig(directory) });
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

function commit(directory, title, body, options = {}) {
	const args = ['commit', '--allow-empty', '--quiet', '-m', title];
	if (body) {
		args.push('-m', body);
	}
	runGit(directory, args, options);
	return runGit(directory, ['log', '-1', '--format=%B'], options);
}

function commitResult(directory, title, body, options = {}) {
	const args = ['commit', '--allow-empty', '--quiet', '-m', title];
	if (body) {
		args.push('-m', body);
	}
	return runGitResult(directory, args, options);
}

function parseTrailers(directory, message, options = {}) {
	return runGit(directory, ['interpret-trailers', '--parse'], {
		...options,
		input: message,
	});
}

function createGlobalConfig(directory) {
	const configPath = path.join(directory, 'global.gitconfig');
	const hooksPath = path.join(directory, 'global-hooks');
	mkdirSync(hooksPath, { recursive: true });

	for (const hookName of ['commit-msg', 'pre-commit']) {
		writeFileSync(
			path.join(hooksPath, hookName),
			readFileSync(path.join(FIXTURE_HOOKS_PATH, hookName)),
			{ mode: 0o755 },
		);
	}

	runGit(directory, ['config', '--file', configPath, 'core.hooksPath', hooksPath]);

	return {
		GIT_CONFIG_GLOBAL: configPath,
		GIT_CONFIG_NOSYSTEM: '1',
	};
}

function writeProjectHook(directory, script) {
	const hookDirectory = path.join(directory, 'scripts', 'hooks');
	mkdirSync(hookDirectory, { recursive: true });
	writeFileSync(path.join(hookDirectory, 'pre-commit'), '#!/bin/sh\n' + script + '\n', {
		mode: 0o755,
	});
}

describe('global commit-msg validator', () => {
	it('allows a normal non-AI commit', () => {
		withRepository((directory, options) => {
			const message = commit(directory, 'docs: normal commit', '', options);
			assert.match(message, /^docs: normal commit$/m);
		});
	});

	it('allows a complete Codex trailer block', () => {
		withRepository((directory, options) => {
			const message = commit(directory, 'feat: Codex change', EXACT_CODEX_TRAILERS, options);
			assert.match(message, /^AI-Agent: Codex$/m);
			assert.match(message, /^AI-Model: gpt-5\.6-luna$/m);
			assert.match(message, /^AI-Reasoning: xhigh$/m);
			assert.match(message, /^Co-authored-by: Codex <noreply@openai.com>$/m);

			const parsed = parseTrailers(directory, message, options);
			assert.match(parsed, /^AI-Agent: Codex$/m);
			assert.match(parsed, /^AI-Model: gpt-5\.6-luna$/m);
			assert.match(parsed, /^AI-Reasoning: xhigh$/m);
			assert.match(parsed, /^Co-authored-by: Codex <noreply@openai.com>$/m);
		});
	});

	it('allows coarse runtime metadata with unknown reasoning', () => {
		withRepository((directory, options) => {
			const message = commit(
				directory,
				'feat: coarse Codex change',
				PARTIAL_CODEX_TRAILERS,
				options,
			);
			assert.match(message, /^AI-Model: GPT-5$/m);
			assert.match(message, /^AI-Reasoning: unknown$/m);
		});
	});

	it('allows unknown runtime metadata', () => {
		withRepository((directory, options) => {
			const message = commit(
				directory,
				'feat: unknown Codex runtime',
				UNKNOWN_CODEX_TRAILERS,
				options,
			);
			assert.match(message, /^AI-Model: unknown$/m);
			assert.match(message, /^AI-Reasoning: unknown$/m);
		});
	});

	it('allows Claude Code with the same trailer schema', () => {
		withRepository((directory, options) => {
			const message = commit(directory, 'feat: Claude change', VALID_CLAUDE_TRAILERS, options);
			assert.match(message, /^AI-Agent: Claude Code$/m);
			assert.match(message, /^AI-Model: test-model$/m);
			assert.match(message, /^AI-Reasoning: high$/m);
		});
	});

	it('rejects an AI commit with AI-Model missing', () => {
		withRepository((directory, options) => {
			const result = commitResult(
				directory,
				'feat: missing model',
				['AI-Agent: Codex', 'AI-Reasoning: xhigh', CODEX_TRAILER].join('\n'),
				options,
			);
			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /AI-Model/);
		});
	});

	it('rejects an AI commit with AI-Reasoning missing', () => {
		withRepository((directory, options) => {
			const result = commitResult(
				directory,
				'feat: missing reasoning',
				['AI-Agent: Codex', 'AI-Model: test-model', CODEX_TRAILER].join('\n'),
				options,
			);
			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /AI-Reasoning/);
		});
	});

	it('rejects duplicate AI-Agent, AI-Model, or AI-Reasoning trailers', () => {
		withRepository((directory, options) => {
			const result = commitResult(
				directory,
				'feat: duplicate metadata',
				[
					'AI-Agent: Codex',
					'AI-Agent: Claude Code',
					'AI-Model: test-model',
					'AI-Model: other-model',
					'AI-Reasoning: xhigh',
					'AI-Reasoning: high',
					CODEX_TRAILER,
				].join('\n'),
				options,
			);
			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /Duplicate trailers are not allowed/);
		});
	});

	it('rejects v2 placeholder values in model and reasoning trailers', () => {
		const placeholders = [
			'default',
			'TBD',
			'TODO',
			'N/A',
			'NA',
			'null',
			'placeholder',
			'<actual model>',
			'<actual reasoning>',
			'<model>',
			'<reasoning>',
		];

		for (const field of ['AI-Model', 'AI-Reasoning']) {
			for (const value of placeholders) {
				withRepository((directory, options) => {
					const model = field === 'AI-Model' ? value : 'GPT-5';
					const reasoning = field === 'AI-Reasoning' ? value : 'xhigh';
					const result = commitResult(
						directory,
						'feat: placeholder metadata',
						[
							'AI-Agent: Codex',
							`AI-Model: ${model}`,
							`AI-Reasoning: ${reasoning}`,
							CODEX_TRAILER,
						].join('\n'),
						options,
					);

					assert.notEqual(result.status, 0, `${field}=${value} should be rejected`);
					assert.match(result.stderr, /placeholder values/);
				});
			}
		}
	});

	it('allows multiple co-authors alongside the AI attribution', () => {
		withRepository((directory, options) => {
			const message = commit(
				directory,
				'feat: multiple contributors',
				[
					'AI-Agent: Codex',
					'AI-Model: test-model',
					'AI-Reasoning: xhigh',
					'Co-authored-by: Human Contributor <human@example.com>',
					CODEX_TRAILER,
				].join('\n'),
				options,
			);
			assert.match(message, /^Co-authored-by: Human Contributor <human@example.com>$/m);
			assert.match(message, /^Co-authored-by: Codex <noreply@openai.com>$/m);
		});
	});
});

describe('global pre-commit dispatcher', () => {
	it('allows commits when a project hook is absent', () => {
		withRepository((directory, options) => {
			const result = commitResult(directory, 'docs: no project hook', 'ordinary change', options);
			assert.equal(result.status, 0, result.stdout + '\n' + result.stderr);
			assert.match(runGit(directory, ['log', '-1', '--format=%B']), /ordinary change/);
		});
	});

	it('calls the project hook when it is present', () => {
		withRepository((directory, options) => {
			const markerPath = path.join(directory, 'hook-marker');
			writeProjectHook(directory, 'printf invoked > hook-marker');
			const result = commitResult(directory, 'test: project hook', 'Project hook', options);
			assert.equal(result.status, 0, result.stdout + '\n' + result.stderr);
			assert.equal(readFileSync(markerPath, 'utf8'), 'invoked');
		});
	});

	it('sets a dispatcher guard while the project hook runs', () => {
		withRepository((directory, options) => {
			const markerPath = path.join(directory, 'hook-marker');
			writeProjectHook(
				directory,
				'test "${GIT_GLOBAL_HOOK_DISPATCH:-}" = 1\nprintf guarded > hook-marker',
			);
			const result = commitResult(directory, 'test: project hook guard', 'Guarded hook', options);

			assert.equal(result.status, 0, result.stdout + '\n' + result.stderr);
			assert.equal(readFileSync(markerPath, 'utf8'), 'guarded');
		});
	});

	it('passes a project hook failure to Git', () => {
		withRepository((directory, options) => {
			writeProjectHook(directory, 'exit 23');
			const result = commitResult(directory, 'test: failing project hook', 'Failing hook', options);
			assert.notEqual(result.status, 0);
			assert.notEqual(runGitResult(directory, ['rev-parse', '--verify', 'HEAD']).status, 0);
		});
	});
});
