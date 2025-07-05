/**
 * @fileoverview Path anonymization utilities for privacy protection
 *
 * This module provides functions to remove usernames and other potentially
 * sensitive information from file paths across different operating systems.
 * It ensures that project names and paths don't leak user identities.
 */

import * as os from 'node:os';

/**
 * Get the current username for the system
 * Cached to avoid repeated OS calls
 */
let cachedUsername: string | null = null;
function getCurrentUsername(): string {
	if (cachedUsername === null) {
		cachedUsername = os.userInfo().username;
	}
	return cachedUsername;
}

// For testing purposes - allows overriding the username
export function _setTestUsername(username: string | null): void {
	cachedUsername = username;
}

/**
 * Common username patterns to detect and remove
 * These are fallbacks if we can't detect the actual username
 */
const USERNAME_PATTERNS = [
	// macOS/Linux home directories
	/^\/Users\/([^/]+)\//i,
	/^\/home\/([^/]+)\//i,
	// Windows paths (both forward and backslash)
	/^[A-Z]:[\\/]Users[\\/]([^\\/]+)[\\/]/i,
	/^[A-Z]:[\\/]Documents and Settings[\\/]([^\\/]+)[\\/]/i,
	// WSL paths
	/^\/mnt\/[a-z]\/Users\/([^/]+)\//i,
];

/**
 * Anonymize a full file path by removing username information
 * @param filePath - The file path to anonymize
 * @returns Anonymized path with username replaced
 */
export function anonymizePath(filePath: string): string {
	if (filePath === '' || filePath == null) {
		return filePath;
	}

	// Normalize path separators for consistent processing
	const normalizedPath = filePath.replace(/\\/g, '/');

	// First try to replace the actual current username
	const currentUser = getCurrentUsername();
	if (currentUser !== '') {
		// Create patterns for the current user
		const userPatterns = [
			// Case-insensitive username in paths
			new RegExp(`(/Users/|/home/|\\\\Users\\\\|C:\\\\Users\\\\|/Documents and Settings/)${escapeRegExp(currentUser)}(/|\\\\)`, 'gi'),
			// Username at the start of a path segment
			new RegExp(`(^|/)${escapeRegExp(currentUser)}(/|$)`, 'gi'),
		];

		let anonymized = filePath;
		for (const pattern of userPatterns) {
			anonymized = anonymized.replace(pattern, (match, prefix, suffix) => {
				if (prefix != null && suffix != null) {
					return `${prefix}[user]${suffix}`;
				}
				return match.replace(currentUser, '[user]');
			});
		}

		// If we made changes, return the anonymized version
		if (anonymized !== filePath) {
			return anonymized;
		}
	}

	// Fallback: try common path patterns
	for (const pattern of USERNAME_PATTERNS) {
		const match = normalizedPath.match(pattern);
		if (match != null && match[1] != null && match[1] !== '') {
			const username = match[1];
			// Replace this username everywhere in the path
			const escapedUsername = escapeRegExp(username);
			const replacementPattern = new RegExp(escapedUsername, 'gi');
			return filePath.replace(replacementPattern, '[user]');
		}
	}

	return filePath;
}

/**
 * Anonymize a project name that might contain username information
 * @param projectName - The project name to check and anonymize
 * @returns Anonymized project name
 */
export function anonymizeProjectName(projectName: string): string {
	if (projectName === '' || projectName == null) {
		return projectName;
	}

	const currentUser = getCurrentUsername();
	if (currentUser === '' || currentUser == null) {
		return projectName;
	}

	// Check if the project name contains the username
	const userLower = currentUser.toLowerCase();
	const projectLower = projectName.toLowerCase();

	// Direct username match
	if (projectLower.includes(userLower)) {
		// Replace case-insensitively
		const pattern = new RegExp(escapeRegExp(currentUser), 'gi');
		return projectName.replace(pattern, '[user]');
	}

	// Check for common patterns like "work-username" or "username-project"
	const commonPatterns = [
		new RegExp(`^${escapeRegExp(currentUser)}-`, 'i'),
		new RegExp(`-${escapeRegExp(currentUser)}$`, 'i'),
		new RegExp(`-${escapeRegExp(currentUser)}-`, 'i'),
		new RegExp(`_${escapeRegExp(currentUser)}_`, 'i'),
		new RegExp(`^${escapeRegExp(currentUser)}_`, 'i'),
		new RegExp(`_${escapeRegExp(currentUser)}$`, 'i'),
	];

	for (const pattern of commonPatterns) {
		if (pattern.test(projectName)) {
			return projectName.replace(pattern, (match) => {
				return match.replace(new RegExp(escapeRegExp(currentUser), 'gi'), '[user]');
			});
		}
	}

	// Check for email-like patterns
	// Match username@domain where domain is any non-whitespace, non-dash characters
	const emailPattern = new RegExp(`${escapeRegExp(currentUser)}(@[^\\s\\-]+)`, 'gi');
	const result = projectName.replace(emailPattern, () => {
		// Replace the domain part with [domain]
		return '[user]@[domain]';
	});

	return result;
}

/**
 * Extract and anonymize a project path from a full file path
 * @param filePath - The full file path
 * @param baseDir - The base directory to calculate relative path from
 * @returns Anonymized project path
 */
export function extractAnonymizedProjectPath(filePath: string, baseDir: string): string {
	// Determine the path separator to use based on the input paths
	const separator = filePath.includes('\\') || baseDir.includes('\\') ? '\\' : '/';

	// Normalize slashes to be consistent
	const normalizedFilePath = filePath.replace(/[/\\]/g, separator);
	const normalizedBaseDir = baseDir.replace(/[/\\]/g, separator);

	// Simple check if filePath starts with baseDir
	if (!normalizedFilePath.startsWith(normalizedBaseDir)) {
		return 'Unknown Project';
	}

	// Get the relative part by removing the base directory
	let relativePath = normalizedFilePath.substring(normalizedBaseDir.length);

	// Remove leading separator if present
	if (relativePath.startsWith(separator)) {
		relativePath = relativePath.substring(1);
	}

	// Extract project name (first directory in the relative path)
	const parts = relativePath.split(separator);
	const projectName = parts.length > 0 && parts[0] !== '' ? parts[0] : 'Unknown Project';

	// Anonymize the project name
	return projectName !== '' ? anonymizeProjectName(projectName) : projectName;
}

/**
 * Escape special regex characters in a string
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Export for testing
export const _testing = {
	getCurrentUsername,
	USERNAME_PATTERNS,
};

if (import.meta.vitest != null) {
	const { describe, it, expect, beforeEach } = import.meta.vitest;

	describe('Path Anonymizer', () => {
		beforeEach(() => {
			// Reset cached username
			_setTestUsername(null);
		});

		describe('anonymizePath', () => {
			it('should anonymize macOS paths', () => {
				_setTestUsername('johndoe');

				expect(anonymizePath('/Users/johndoe/projects/myapp')).toBe('/Users/[user]/projects/myapp');
				expect(anonymizePath('/Users/JohnDoe/projects/myapp')).toBe('/Users/[user]/projects/myapp');
			});

			it('should anonymize Windows paths', () => {
				_setTestUsername('alice');

				expect(anonymizePath('C:\\Users\\alice\\Documents\\project')).toBe('C:\\Users\\[user]\\Documents\\project');
				expect(anonymizePath('C:/Users/alice/Documents/project')).toBe('C:/Users/[user]/Documents/project');
				expect(anonymizePath('C:\\Documents and Settings\\alice\\My Documents')).toBe('C:\\Documents and Settings\\[user]\\My Documents');
			});

			it('should anonymize Linux paths', () => {
				_setTestUsername('bob');

				expect(anonymizePath('/home/bob/workspace/project')).toBe('/home/[user]/workspace/project');
			});

			it('should handle paths without usernames', () => {
				_setTestUsername('testuser');

				expect(anonymizePath('/opt/application/data')).toBe('/opt/application/data');
				expect(anonymizePath('C:\\Program Files\\App')).toBe('C:\\Program Files\\App');
			});

			it('should handle empty paths', () => {
				expect(anonymizePath('')).toBe('');
				expect(anonymizePath(null as unknown as string)).toBe(null);
				expect(anonymizePath(undefined as unknown as string)).toBe(undefined);
			});

			it('should use fallback patterns when username is not available', () => {
				_setTestUsername('');

				expect(anonymizePath('/Users/someuser/projects')).toBe('/Users/[user]/projects');
				expect(anonymizePath('C:\\Users\\Administrator\\Desktop')).toBe('C:\\Users\\[user]\\Desktop');
			});
		});

		describe('anonymizeProjectName', () => {
			it('should anonymize project names containing username', () => {
				_setTestUsername('john');

				expect(anonymizeProjectName('work-john')).toBe('work-[user]');
				expect(anonymizeProjectName('john-personal')).toBe('[user]-personal');
				expect(anonymizeProjectName('project-john-test')).toBe('project-[user]-test');
			});

			it('should handle case-insensitive matching', () => {
				_setTestUsername('Alice');

				expect(anonymizeProjectName('alice-work')).toBe('[user]-work');
				expect(anonymizeProjectName('ALICE_PROJECT')).toBe('[user]_PROJECT');
				expect(anonymizeProjectName('Work-Alice-Stuff')).toBe('Work-[user]-Stuff');
			});

			it('should anonymize email-like patterns', () => {
				_setTestUsername('bob');

				expect(anonymizeProjectName('bob@company.com-project')).toBe('[user]@[domain]-project');
				expect(anonymizeProjectName('project-bob@email.co.uk')).toBe('project-[user]@[domain]');
			});

			it('should not change project names without username', () => {
				_setTestUsername('user123');

				expect(anonymizeProjectName('my-awesome-project')).toBe('my-awesome-project');
				expect(anonymizeProjectName('work-stuff')).toBe('work-stuff');
			});
		});

		describe('extractAnonymizedProjectPath', () => {
			it('should extract and anonymize project paths', () => {
				_setTestUsername('developer');

				const filePath = '/Users/developer/.claude/projects/work-developer/session123/chat.jsonl';
				const baseDir = '/Users/developer/.claude/projects';

				expect(extractAnonymizedProjectPath(filePath, baseDir)).toBe('work-[user]');
			});

			it('should handle Windows paths', () => {
				_setTestUsername('admin');

				const filePath = 'C:\\Users\\admin\\.claude\\projects\\admin-tools\\session\\file.jsonl';
				const baseDir = 'C:\\Users\\admin\\.claude\\projects';

				expect(extractAnonymizedProjectPath(filePath, baseDir)).toBe('[user]-tools');
			});
		});
	});
}
