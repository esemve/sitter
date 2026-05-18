import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { findAiCommentsWithRipgrep } from './ripgrep-scanner.js';

// Mock child_process so we can simulate specific spawnSync return values in some tests.
// The default behavior delegates to the real spawnSync implementation.
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    spawnSync: vi.fn((...args: any[]) => actual.spawnSync(...args)),
  };
});

import { spawnSync } from 'child_process';

describe('findAiCommentsWithRipgrep', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-rg-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.mocked(spawnSync).mockClear();
  });

  it('returns empty array for empty directory', () => {
    const result = findAiCommentsWithRipgrep(tempDir);
    expect(result).toEqual([]);
  });

  it('returns empty array when no AI comments exist', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\nconsole.log(x);',
      'utf-8'
    );

    const result = findAiCommentsWithRipgrep(tempDir);
    expect(result).toEqual([]);
  });

  it('finds a single AI comment', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\n// @@AI@@: Added for debugging\nconsole.log(x);',
      'utf-8'
    );

    const result = findAiCommentsWithRipgrep(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].file.endsWith('/src/index.ts')).toBe(true);
    expect(result[0].line).toBe(2);
  });

  it('finds multiple AI comments across multiple files', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'a.ts'),
      '// @@AI@@: comment in a\nconst x = 1;',
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'src', 'b.ts'),
      'const y = 2;\n// @@AI@@: comment in b\nconsole.log(y);',
      'utf-8'
    );
    writeFileSync(
      join(tempDir, 'root.ts'),
      '// @@AI@@: root comment\n',
      'utf-8'
    );

    const result = findAiCommentsWithRipgrep(tempDir);
    expect(result).toHaveLength(3);

    const sorted = [...result].sort((a, b) => a.file.localeCompare(b.file));
    expect(sorted[0].file.endsWith('/root.ts')).toBe(true);
    expect(sorted[0].line).toBe(1);
    expect(sorted[1].file.endsWith('/src/a.ts')).toBe(true);
    expect(sorted[1].line).toBe(1);
    expect(sorted[2].file.endsWith('/src/b.ts')).toBe(true);
    expect(sorted[2].line).toBe(2);
  });

  it('respects .gitignore exclusions', () => {
    writeFileSync(join(tempDir, '.gitignore'), 'build/\n', 'utf-8');

    mkdirSync(join(tempDir, 'build'), { recursive: true });
    writeFileSync(
      join(tempDir, 'build', 'output.js'),
      '// @@AI@@: Should be ignored\n',
      'utf-8'
    );

    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\nconsole.log(x);',
      'utf-8'
    );

    const result = findAiCommentsWithRipgrep(tempDir);
    expect(result).toEqual([]);
  });

  it('respects hardcoded exclusions (node_modules, dist, coverage, sitter)', () => {
    const excludedDirs = ['node_modules', 'dist', 'coverage', 'sitter'];
    for (const dir of excludedDirs) {
      const subDir = join(tempDir, dir, 'pkg');
      mkdirSync(subDir, { recursive: true });
      writeFileSync(
        join(subDir, 'file.js'),
        `// @@AI@@: Should be ignored in ${dir}\n`,
        'utf-8'
      );
    }

    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(
      join(tempDir, 'src', 'index.ts'),
      'const x = 1;\n// @@AI@@: valid comment\nconsole.log(x);',
      'utf-8'
    );

    const result = findAiCommentsWithRipgrep(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].file.endsWith('/src/index.ts')).toBe(true);
    expect(result[0].line).toBe(2);
  });

  it('throws on ripgrep error (exit code 2)', () => {
    // Trigger a real ripgrep error by passing a non-existent directory.
    expect(() => findAiCommentsWithRipgrep('/nonexistent-path-12345')).toThrow('ripgrep error');
  });

  it('ignores malformed JSON lines', () => {
    const mockedSpawn = vi.mocked(spawnSync);
    mockedSpawn.mockReturnValueOnce({
      status: 0,
      stdout:
        'not-json-at-all\n{"type":"match","data":{"path":{"text":"/foo.ts"},"line_number":1}}\n',
      stderr: '',
      error: undefined,
    } as any);

    const result = findAiCommentsWithRipgrep(tempDir);
    expect(result).toEqual([{ file: '/foo.ts', line: 1 }]);
  });
});
