import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(TEST_DIR, '..', '..');
const HOOKS_DIR = path.join(ROOT_DIR, 'scripts', 'hooks').replaceAll('\\', '/');
const CODEX_TRAILER = 'Co-authored-by: Codex <noreply@openai.com>';

function runGit(cwd, args, { aiModel, env: envOverrides = {} } = {}) {
	const env = { ...process.env, ...envOverrides };
	delete env.AI_MODEL;
	if (aiModel !== undefined) {
		env.AI_MODEL = aiModel;
	}

	const result = spawnSync('git', args, {
		cwd,
		encoding: 'utf8',
		env,
	});

	assert.equal(
		result.status,
		0,
		`git ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
	);

	return result.stdout;
}

function withRepository(callback) {
	const directory = mkdtempSync(path.join(tmpdir(), 'chocobreeze-hook-test-'));

	try {
		runGit(directory, ['init', '--quiet']);
		runGit(directory, ['config', 'user.name', 'Hook Test']);
		runGit(directory, ['config', 'user.email', 'hook-test@example.com']);
		runGit(directory, ['config', 'core.hooksPath', HOOKS_DIR]);
		callback(directory);
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
	return runGit(directory, ['log', '-1', '--format=%B']);
}

function createGlobalConfig(directory, model) {
	const configPath = path.join(directory, 'global.gitconfig');
	runGit(directory, ['config', '--file', configPath, 'ai.model', model]);
	return {
		GIT_CONFIG_GLOBAL: configPath,
		GIT_CONFIG_NOSYSTEM: '1',
	};
}

describe('prepare-commit-msg hook', () => {
	it('prefers AI_MODEL over the repository configuration', () => {
		withRepository((directory) => {
			runGit(directory, ['config', 'ai.model', 'repo-model']);
			const message = commit(directory, CODEX_TRAILER, { aiModel: 'env-model' });

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
			runGit(directory, ['config', 'ai.model', '']);
			const message = commit(directory, CODEX_TRAILER);

			assert.match(message, /^AI-Model: unknown$/m);
		});
	});

	it('does not add a model trailer to non-Codex commits', () => {
		withRepository((directory) => {
			const message = commit(directory, 'Authored without a Codex trailer', {
				aiModel: 'env-model',
			});

			assert.doesNotMatch(message, /^AI-Model:/m);
		});
	});

	it('does not duplicate an existing AI-Model trailer', () => {
		withRepository((directory) => {
			const message = commit(directory, `${CODEX_TRAILER}\nAI-Model: existing-model`, {
				aiModel: 'env-model',
			});

			assert.equal(message.match(/^AI-Model:/gm)?.length, 1);
			assert.match(message, /^AI-Model: existing-model$/m);
		});
	});
});
