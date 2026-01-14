import pc from 'picocolors';
import { RepomixError } from '../../shared/errorHandle.js';
import { logger } from '../../shared/logger.js';
import { searchService } from '../../core/search/searchService.js';
import { runRemoteAction } from './remoteAction.js';
import type { CliOptions } from '../types.js';

export const runSearchAction = async (query: string, options: CliOptions) => {
  logger.log(pc.cyan(`\n🔍 Searching for repository matching: "${query}"...`));

  try {
    const repoUrl = await searchService.findRepositoryUrl(query);

    logger.log(pc.green(`\n✨ Found repository: ${pc.bold(repoUrl)}`));

    // Delegate to remote action with the found URL
    // We pass the URL as the first argument, and options as the second
    return await runRemoteAction(repoUrl, options);
  } catch (error) {
    if (error instanceof RepomixError) {
      throw error;
    }
    throw new RepomixError(`Search action failed: ${(error as Error).message}`, { cause: error });
  }
};
