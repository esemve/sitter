import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { rgPath } from '@vscode/ripgrep';

export interface AiComment {
  file: string;
  line: number;
}

const EXTRA_EXCLUDES = ['node_modules', 'dist', 'coverage', 'sitter'];

export function findAiCommentsWithRipgrep(baseDir: string): AiComment[] {
  const args: string[] = ['--json'];

  for (const pattern of EXTRA_EXCLUDES) {
    args.push('--glob', `!${pattern}`);
  }

  // Explicitly pass .gitignore so it's respected even outside a git repo
  const gitignorePath = join(baseDir, '.gitignore');
  if (existsSync(gitignorePath)) {
    args.push('--ignore-file', gitignorePath);
  }

  args.push('@@AI@@:', baseDir);

  const result = spawnSync(rgPath, args, { encoding: 'utf-8' });

  // exit code 0 = matches found, 1 = no matches, 2 = error
  if (result.status === 2 || result.error) {
    throw new Error(`ripgrep error: ${result.stderr || result.error}`);
  }

  if (!result.stdout) return [];

  const comments: AiComment[] = [];

  for (const line of result.stdout.split('\n')) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'match') {
        comments.push({
          file: parsed.data.path.text,
          line: parsed.data.line_number,
        });
      }
    } catch {
      // ignore malformed lines
    }
  }

  return comments;
}
