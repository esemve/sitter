import { assertActiveProject } from '../state/validation.js';
import { readProjectStatus, writeProjectStatus } from '../state/project-status.js';
import { success, error } from '../utils/output.js';
import { findAiCommentsWithRipgrep } from '../utils/ripgrep-scanner.js';

export async function apply(): Promise<void> {
  let projectName: string;
  try {
    projectName = await assertActiveProject();
  } catch (err) {
    error('NO_ACTIVE_PROJECT', err instanceof Error ? err.message : String(err));
    return;
  }

  const projectStatus = await readProjectStatus(projectName);
  if (projectStatus.status !== 'REVIEW') {
    error('NOT_REVIEW_PHASE', 'Project is not in review phase');
    return;
  }

  let aiComments;
  try {
    aiComments = findAiCommentsWithRipgrep(process.cwd());
  } catch (err) {
    error('RIPGREP_ERROR', err instanceof Error ? err.message : String(err));
    return;
  }

  if (aiComments.length > 0) {
    success({ clean: false, ai_comments: aiComments });
    return;
  }

  await writeProjectStatus(projectName, { status: 'IMPLEMENT', currentTask: null });
  success({ clean: true, status: 'IMPLEMENT' });
}
