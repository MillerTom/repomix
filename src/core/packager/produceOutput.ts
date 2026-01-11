import path from 'node:path';
import { defaultFilePathMap, type RepomixConfigMerged, type RepomixOutputStyle } from '../../config/configSchema.js';
import { withMemoryLogging } from '../../shared/memoryUtils.js';
import type { RepomixProgressCallback } from '../../shared/types.js';
import type { FilesByRoot } from '../file/fileTreeGenerate.js';
import type { ProcessedFile } from '../file/fileTypes.js';
import type { GitDiffResult } from '../git/gitDiffHandle.js';
import type { GitLogResult } from '../git/gitLogHandle.js';
import { generateOutput as generateOutputDefault } from '../output/outputGenerate.js';
import { generateSplitOutputParts } from '../output/outputSplit.js';
import { copyToClipboardIfEnabled as copyToClipboardIfEnabledDefault } from './copyToClipboardIfEnabled.js';
import { writeOutputToDisk as writeOutputToDiskDefault } from './writeOutputToDisk.js';

export interface ProduceOutputResult {
  outputFiles?: string[];
  outputForMetrics: string | string[];
}

const defaultDeps = {
  generateOutput: generateOutputDefault,
  writeOutputToDisk: writeOutputToDiskDefault,
  copyToClipboardIfEnabled: copyToClipboardIfEnabledDefault,
};

export const produceOutput = async (
  rootDirs: string[],
  config: RepomixConfigMerged,
  processedFiles: ProcessedFile[],
  allFilePaths: string[],
  gitDiffResult: GitDiffResult | undefined,
  gitLogResult: GitLogResult | undefined,
  progressCallback: RepomixProgressCallback,
  filePathsByRoot?: FilesByRoot[],
  overrideDeps: Partial<typeof defaultDeps> = {},
): Promise<ProduceOutputResult> => {
  const deps = { ...defaultDeps, ...overrideDeps };

  const splitMaxBytes = config.output.splitOutput;

  if (splitMaxBytes !== undefined) {
    return await generateAndWriteSplitOutput(
      rootDirs,
      config,
      processedFiles,
      allFilePaths,
      splitMaxBytes,
      gitDiffResult,
      gitLogResult,
      progressCallback,
      filePathsByRoot,
      deps,
    );
  }

  return await generateAndWriteSingleOutput(
    rootDirs,
    config,
    processedFiles,
    allFilePaths,
    gitDiffResult,
    gitLogResult,
    progressCallback,
    filePathsByRoot,
    deps,
  );
};

const generateAndWriteSplitOutput = async (
  rootDirs: string[],
  config: RepomixConfigMerged,
  processedFiles: ProcessedFile[],
  allFilePaths: string[],
  splitMaxBytes: number,
  gitDiffResult: GitDiffResult | undefined,
  gitLogResult: GitLogResult | undefined,
  progressCallback: RepomixProgressCallback,
  filePathsByRoot: FilesByRoot[] | undefined,
  deps: typeof defaultDeps,
): Promise<ProduceOutputResult> => {
  const parts = await withMemoryLogging('Generate Split Output', async () => {
    return await generateSplitOutputParts({
      rootDirs,
      baseConfig: config,
      processedFiles,
      allFilePaths,
      maxBytesPerPart: splitMaxBytes,
      gitDiffResult,
      gitLogResult,
      progressCallback,
      filePathsByRoot,
      deps: {
        generateOutput: deps.generateOutput,
      },
    });
  });

  progressCallback('Writing output files...');
  await withMemoryLogging('Write Split Output', async () => {
    for (const part of parts) {
      const partConfig = {
        ...config,
        output: {
          ...config.output,
          stdout: false,
          filePath: part.filePath,
        },
      };
      // eslint-disable-next-line no-await-in-loop
      await deps.writeOutputToDisk(part.content, partConfig);
    }
  });

  return {
    outputFiles: parts.map((p) => p.filePath),
    outputForMetrics: parts.map((p) => p.content),
  };
};

const generateAndWriteSingleOutput = async (
  rootDirs: string[],
  config: RepomixConfigMerged,
  processedFiles: ProcessedFile[],
  allFilePaths: string[],
  gitDiffResult: GitDiffResult | undefined,
  gitLogResult: GitLogResult | undefined,
  progressCallback: RepomixProgressCallback,
  filePathsByRoot: FilesByRoot[] | undefined,
  deps: typeof defaultDeps,
): Promise<ProduceOutputResult> => {
  if (config.output.style === 'all') {
    const styles: RepomixOutputStyle[] = ['xml', 'markdown', 'json', 'plain', 'sql'];
    const outputs: string[] = [];
    const outputFiles: string[] = [];

    // Determine base name for output files
    let baseName = config.output.filePath;
    // Remove extension if it matches one of the known extensions
    const knownExtensions = Object.values(defaultFilePathMap).map((p) => path.extname(p));
    const ext = path.extname(baseName);
    if (knownExtensions.includes(ext) || ext === '.txt' || ext === '.xml' || ext === '.json' || ext === '.md' || ext === '.sql') {
      baseName = baseName.slice(0, -ext.length);
    }
    
    // If baseName is empty or just a dot (e.g. user passed output as directory or something weird), fallback
    if (!baseName || baseName === '.') {
      baseName = 'repomix-output';
    }

    progressCallback('Generating all output formats...');

    for (const style of styles) {
      const defaultName = defaultFilePathMap[style];
      const extension = path.extname(defaultName);
      const filePath = `${baseName}${extension}`;

      const styleConfig: RepomixConfigMerged = {
        ...config,
        output: {
          ...config.output,
          style: style,
          filePath: filePath,
        },
      };

      const output = await withMemoryLogging(`Generate Output (${style})`, () =>
        deps.generateOutput(rootDirs, styleConfig, processedFiles, allFilePaths, gitDiffResult, gitLogResult, filePathsByRoot),
      );

      await withMemoryLogging(`Write Output (${style})`, () => deps.writeOutputToDisk(output, styleConfig));

      outputs.push(output);
      outputFiles.push(filePath);
    }

    return {
      outputFiles,
      // Use XML (index 0) for metrics as it's the default/canonical format
      outputForMetrics: outputs[0],
    };
  }

  const output = await withMemoryLogging('Generate Output', () =>
    deps.generateOutput(rootDirs, config, processedFiles, allFilePaths, gitDiffResult, gitLogResult, filePathsByRoot),
  );

  progressCallback('Writing output file...');
  await withMemoryLogging('Write Output', () => deps.writeOutputToDisk(output, config));

  await deps.copyToClipboardIfEnabled(output, progressCallback, config);

  return {
    outputForMetrics: output,
  };
};
