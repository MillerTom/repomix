import process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import { RepomixError } from '../../shared/errorHandle.js';
import { logger } from '../../shared/logger.js';

export interface SearchResult {
  url: string;
}

export class SearchService {
  private client: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new RepomixError(
        'GOOGLE_API_KEY environment variable is not set. Please set it to use the search feature.\n' +
        'Example: export GOOGLE_API_KEY=your_api_key'
      );
    }
    this.client = new GoogleGenAI({ apiKey: key });
  }

  async findRepositoryUrl(query: string): Promise<string> {
    try {
      const interaction = await this.client.interactions.create({
        model: 'gemini-2.0-flash', // Rolling back to a more likely available model, or we can make this configurable
        // @ts-ignore - googleSearch is available in the API but might be missing from SDK types
        tools: [{ googleSearch: {} }],
        input: `Find the official GitHub repository for '${query}'. 
                Return ONLY a JSON object with a single key "url" containing the full HTTPS URL of the repository. 
                Example: {"url": "https://github.com/facebook/react"}
                Do not include markdown formatting or explanations.`,
      });

      // Use any cast to bypass potential type mismatches in the beta SDK
      const responseText = (interaction.outputs?.[0] as any)?.text;

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

      return repoUrl;
    } catch (error) {
      if (error instanceof RepomixError) {
        throw error;
      }
      // Handle SDK errors
      throw new RepomixError(`Search failed: ${(error as Error).message}`, { cause: error });
    }
  }
}

export const searchService = new SearchService();
