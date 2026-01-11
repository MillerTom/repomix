import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { RepomixConfigMerged } from '../../../src/config/configSchema.js';
import { produceOutput } from '../../../src/core/packager/produceOutput.js';
import { createMockConfig } from '../../testing/testUtils.js';

describe('produceOutput with style "all"', () => {
  const mockConfig: RepomixConfigMerged = createMockConfig({
    output: {
      filePath: 'test-output.xml',
      style: 'all',
      files: true,
    },
  });

  const mockProcessedFiles = [
    {
      path: 'test.txt',
      content: 'content',
    },
  ];

  const mockDeps = {
    generateOutput: vi.fn().mockResolvedValue('mock output'),
    writeOutputToDisk: vi.fn().mockResolvedValue(undefined),
    copyToClipboardIfEnabled: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should generate and write output for all supported styles', async () => {
    const result = await produceOutput(
      ['/test'],
      mockConfig,
      mockProcessedFiles,
      ['test.txt'],
      undefined,
      undefined,
      vi.fn(), // progressCallback
      undefined,
      mockDeps,
    );

    // Verify generateOutput was called 5 times (xml, markdown, json, plain, sql)
    expect(mockDeps.generateOutput).toHaveBeenCalledTimes(5);

    // Verify writeOutputToDisk was called 5 times
    expect(mockDeps.writeOutputToDisk).toHaveBeenCalledTimes(5);

    // Verify output files in result
    expect(result.outputFiles).toHaveLength(5);
    expect(result.outputFiles).toEqual([
      'test-output.xml',
      'test-output.md',
      'test-output.json',
      'test-output.txt',
      'test-output.sql',
    ]);

    // Verify the outputForMetrics is the first one (XML)
    expect(result.outputForMetrics).toBe('mock output');
  });

  test('should handle base filename correctly', async () => {
    const configWithTxt = createMockConfig({
      output: {
        filePath: 'custom.txt',
        style: 'all',
      },
    });

    const result = await produceOutput(
        ['/test'],
        configWithTxt,
        mockProcessedFiles,
        ['test.txt'],
        undefined,
        undefined,
        vi.fn(),
        undefined,
        mockDeps,
      );
  
      expect(result.outputFiles).toContain('custom.xml');
      expect(result.outputFiles).toContain('custom.md');
      expect(result.outputFiles).toContain('custom.json');
      expect(result.outputFiles).toContain('custom.txt');
      expect(result.outputFiles).toContain('custom.sql');
  });
});
