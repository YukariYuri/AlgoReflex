import { describe, expect, it } from 'vitest';
import { sanitizeDiagnostics } from '../src/diagnostics.js';

describe('diagnostic sanitization', () => {
  it('preserves the virtual source filename but removes host paths and container names', () => {
    const output = sanitizeDiagnostics(
      '/sandbox/source/main.cpp:4: error\n/home/runner/secret.txt\nalgoreflex-execute-abc123',
      4096
    );

    expect(output).toContain('main.cpp:4');
    expect(output).not.toContain('/home/runner');
    expect(output).not.toContain('algoreflex-execute-abc123');
  });

  it('bounds diagnostic output', () => {
    expect(sanitizeDiagnostics('x'.repeat(100), 20)).toContain('[diagnostics truncated]');
  });
});
