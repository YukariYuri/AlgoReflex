/**
 * Removes runner-specific paths and bounds diagnostics before they leave the
 * runner service. User-facing virtual source filenames remain useful.
 */
export function sanitizeDiagnostics(diagnostics: string, maxBytes: number): string {
  const sanitized = diagnostics
    .replaceAll('\r\n', '\n')
    .replaceAll('/sandbox/source/main.cpp', 'main.cpp')
    .replaceAll('/sandbox/bin/program', 'program')
    .replace(
      /(?:[A-Za-z]:)?\/(?:var|home|workspace|root|run|tmp)\/[^\s:'"`]+/g,
      '[internal path]'
    )
    .replace(/algoreflex-(?:compile|execute)-[a-f0-9-]+/g, '[sandbox]');
  const bytes = Buffer.from(sanitized, 'utf8');
  return bytes.byteLength <= maxBytes
    ? sanitized
    : `${bytes.subarray(0, maxBytes).toString('utf8')}\n[diagnostics truncated]`;
}
