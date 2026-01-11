import process from 'node:process';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateOutput } from '../../../../src/core/output/outputGenerate.js';
import { createMockConfig } from '../../../testing/testUtils.js';

vi.mock('fs/promises');

describe('sqlStyle', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('generateOutput for sql should include user-provided header text', async () => {
    const mockConfig = createMockConfig({
      output: {
        filePath: 'output.sql',
        style: 'sql',
        headerText: 'Custom header text',
        topFilesLength: 2,
        showLineNumbers: false,
        removeComments: false,
        removeEmptyLines: false,
      },
    });

    const output = await generateOutput(
      [process.cwd()],
      mockConfig,
      [
        {
          path: 'test.txt',
          content: 'test content',
        },
      ],
      [],
    );

    expect(output).toContain('CREATE TABLE IF NOT EXISTS repository_files');
    expect(output).toContain('Custom header text');
    expect(output).toContain('INSERT INTO repository_files');
  });

  test('sql style: headerText always present, generationHeader only if fileSummaryEnabled', async () => {
    const mockConfig = createMockConfig({
      output: {
        filePath: 'output.sql',
        style: 'sql',
        fileSummary: false,
        headerText: 'SQL HEADER',
      },
    });
    const output = await generateOutput([process.cwd()], mockConfig, [], []);
    expect(output).not.toContain('This file is a merged representation');
    expect(output).toContain('SQL HEADER');
  });
});
