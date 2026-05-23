import { install } from './install.js';
import { getAgentSelection } from '../utils/prompt.js';
import { error } from '../utils/output.js';

/**
 * Orchestrates the install action with interactive agent selection.
 *
 * - If --agent is specified, that agent is installed directly.
 * - If no --agent and running in a TTY, an interactive prompt asks the user
 *   to choose one or more agents.
 * - All selected agents are installed sequentially.
 */
export async function handleInstall(options: { agent?: string }): Promise<void> {
  try {
    const selection = await getAgentSelection(options.agent);

    for (const agent of selection) {
      const ok = await install({ agent });
      if (!ok) return;
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'unsupported_agent') {
      error('UNSUPPORTED_AGENT', err.message);
    } else {
      error(
        'MISSING_AGENT',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
