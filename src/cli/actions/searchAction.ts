import process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import pc from 'picocolors';
import { RepomixError } from '../../shared/errorHandle.js';
import { logger } from '../../shared/logger.js';
import { confirm } from '../prompts/searchPrompts.js';
import { runRemoteAction } from './remoteAction.js';
import type { CliOptions } from '../types.js';

export const runSearchAction = async (query: string, options: CliOptions) => {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new RepomixError(
      'GOOGLE_API_KEY environment variable is not set. Please set it to use the search feature.\n' +
      'Example: export GOOGLE_API_KEY=your_api_key'
    );
  }

  logger.log(pc.cyan(`\n🔍 Searching for repository matching: "${query}"...`));

  try {
    const client = new GoogleGenAI({ apiKey });
    
    // Use the Interactions API with search tool
    // We use gemini-2.0-flash-exp as it supports the google_search tool well
    const interaction = await client.interactions.create({
      model: 'gemini-2.0-flash-exp',
      tools: [{ googleSearch: {} }],
      input: `Find the official GitHub repository for '${query}'. 
              Return ONLY a JSON object with a single key "url" containing the full HTTPS URL of the repository. 
              Example: {"url": "https://github.com/facebook/react"}
              Do not include markdown formatting or explanations.`,
    });

    const responseText = interaction.outputs?.[0]?.text;

    if (!responseText) {
      throw new RepomixError('Failed to get a response from the search service.');
    }

    // Clean up the response to ensure we just get the JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.debug('Raw response:', responseText);
      throw new RepomixError('Could not find a valid repository URL in the search results.');
    }

    const result = JSON.parse(jsonMatch[0]);
    const repoUrl = result.url;

    if (!repoUrl || !repoUrl.includes('github.com')) {
       throw new RepomixError(`Invalid repository URL found: ${repoUrl}`);
    }

    logger.log(pc.green(`\n✨ Found repository: ${pc.bold(repoUrl)}`));

    const shouldProceed = await confirm('Proceed to flatten this repository?');

    if (shouldProceed) {
      // Delegate to remote action with the found URL
      // We pass the URL as the first argument, and options as the second
      return await runRemoteAction(repoUrl, options);
    } else {
      logger.log(pc.dim('Operation cancelled.'));
    }

  } catch (error) {
    if (error instanceof RepomixError) {
      throw error;
    }
    // Handle SDK errors
    throw new RepomixError(`Search failed: ${(error as Error).message}`, { cause: error });
  }
};
