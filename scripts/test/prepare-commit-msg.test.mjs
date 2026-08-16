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

function buildEnvironment({ aiModel, env: envOverrides = {} } = {}) {
	const env = { ...process.env, ...envOverrides };
	delete env.AI_MODEL;

	if (aiModel !== undefined) {
		env.AI_MODEL = aiModel;
	}

	return env;
}

function runGitResult(cwd, args, options = {}) {
	return spawnSync('git', args, {
		cwd,
		encoding: 'utf8',
		env: buildEnvironment(options),
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

function commit(directory, body, options = {}) {
	runGit(
		directory,
		['commit', '--allow-empty', '--quiet', '-m', 'Test commit', '-m', body],
		options,
	);
	return runGit(directory, ['log', '-1', '--format=%B'], options);
}

function commitResult(directory, body, options = {}) {
	return runGitResult(
		directory,
		['commit', '--allow-empty', '--quiet', '-m', 'Test commit', '-m', body],
		options,
	);
}

function createGlobalConfig(directory, model) {
	const configPath = path.join(directory, 'global.gitconfig');
	const hooksPath = path.join(directory, 'global-hooks');
	mkdirSync(hooksPath, { recursive: true });

	for (const hookName of ['prepare-commit-msg', 'pre-commit']) {
		writeFileSync(
			path.join(hooksPath, hookName),
			readFileSync(path.join(FIXTURE_HOOKS_PATH, hookName)),
			{ mode: 0o755 },
		);
	}

	runGit(directory, ['config', '--file', configPath, 'core.hooksPath', hooksPath]);

	if (model !== undefined) {
		runGit(directory, ['config', '--file', configPath, 'ai.model', model]);
	}

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

describe('global prepare-commit-msg hook', () => {
	it('prefers AI_MODEL over the repository configuration', () => {
		withRepository((directory, options) => {
			runGit(directory, ['config', 'ai.model', 'repo-model']);
			const message = commit(directory, CODEX_TRAILER, {
				...options,
				aiModel: 'env-model',
			});

			assert.match(message, /^AI-Model: env-model$/m);
			assert.doesNotMatch(message, /^AI-Model: repo-model$/m);
		});
	});

	it('uses the repository ai.model configuration when AI_MODEL is absent', () => {
		withRepository((directory) => {
			const env = createGlobalConfig(directory, 'global-model');
			runGit(directory, ['config', 'ai.model', 'repo-model']);
			const message = commit(directory, CODEX_TRAILER, { env });

			assert.match(message, /^AI-Model: repo-model$/m);
			assert.doesNotMatch(message, /^AI-Model: global-model$/m);
		});
	});

	it('uses the global ai.model configuration when the repository has no value', () => {
		withRepository((directory) => {
			const env = createGlobalConfig(directory, 'global-model');
			const message = commit(directory, CODEX_TRAILER, { env });

			assert.match(message, /^AI-Model: global-model$/m);
		});
	});

	it('falls back to unknown when neither source has a model', () => {
		withRepository((directory) => {
			const env = createGlobalConfig(directory);
			const message = commit(directory, CODEX_TRAILER, { env });

			assert.match(message, /^AI-Model: unknown$/m);
		});
	});

	it('does not add a model trailer to non-Codex commits', () => {
		withRepository((directory, options) => {
			const message = commit(directory, 'Authored without a Codex trailer', {
				...options,
				aiModel: 'env-model',
			});

			assert.doesNotMatch(message, /^AI-Model:/m);
		});
	});

	it('does not duplicate an existing AI-Model trailer', () => {
		withRepository((directory, options) => {
			const message = commit(directory, CODEX_TRAILER + '\nAI-Model: existing-model', {
				...options,
				aiModel: 'env-model',
			});

			assert.equal(message.match(/^AI-Model:/gm)?.length, 1);
			assert.match(message, /^AI-Model: existing-model$/m);
		});
	});
});

describe('global pre-commit dispatcher', () => {
	it('allows commits when a project hook is absent', () => {
		withRepository((directory, options) => {
			const result = commitResult(directory, 'No project hook', options);
			assert.equal(result.status, 0, result.stdout + '\n' + result.stderr);
			assert.match(runGit(directory, ['log', '-1', '--format=%B']), /No project hook/);
		});
	});

	it('calls the project hook when it is present', () => {
		withRepository((directory, options) => {
			const markerPath = path.join(directory, 'hook-marker');
			writeProjectHook(directory, 'printf invoked > hook-marker');
			const result = commitResult(directory, 'Project hook', options);
			assert.equal(result.status, 0, result.stdout + '\n' + result.stderr);
			assert.equal(readFileSync(markerPath, 'utf8'), 'invoked');
		});
	});

	it('passes a project hook failure to Git', () => {
		withRepository((directory, options) => {
			writeProjectHook(directory, 'exit 23');
			const result = commitResult(directory, 'Failing project hook', options);
			assert.notEqual(result.status, 0);
			assert.notEqual(runGitResult(directory, ['rev-parse', '--verify', 'HEAD']).status, 0);
		});
	});
});
