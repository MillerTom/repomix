import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { execGitDiff, execGitLog, execGitLogFilenames } from '../../../src/core/git/gitCommand.js';

vi.mock('node:child_process');
vi.mock('node:util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:util')>();
  return {
    ...actual,
    promisify: vi.fn((fn) => fn),
  };
});

describe('gitCommand buffer size', () => {
  const GIT_MAX_BUFFER = 128 * 1024 * 1024;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should pass GIT_MAX_BUFFER to execGitLogFilenames', async () => {
    const mockExecFile = vi.fn().mockResolvedValue({ stdout: '' });
    await execGitLogFilenames('/test/dir', 100, { execFileAsync: mockExecFile });

    expect(mockExecFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ maxBuffer: GIT_MAX_BUFFER }),
    );
  });

  it('should pass GIT_MAX_BUFFER to execGitDiff', async () => {
    const mockExecFile = vi.fn().mockResolvedValue({ stdout: '' });
    await execGitDiff('/test/dir', [], { execFileAsync: mockExecFile });

    expect(mockExecFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ maxBuffer: GIT_MAX_BUFFER }),
    );
  });

  it('should pass GIT_MAX_BUFFER to execGitLog', async () => {
    const mockExecFile = vi.fn().mockResolvedValue({ stdout: '' });
    await execGitLog('/test/dir', 50, '%x00', { execFileAsync: mockExecFile });

    expect(mockExecFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ maxBuffer: GIT_MAX_BUFFER }),
    );
  });
});
