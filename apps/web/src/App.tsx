import Editor from '@monaco-editor/react';
import type {
  PlaygroundRunResult,
  PlaygroundRunStatus,
  ToolchainProfile,
} from '@algoreflex/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SOURCE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    return 0;
}
`;

const toolchainProfiles: readonly { value: ToolchainProfile; label: string }[] = [
  { value: 'GNU_CPP17', label: 'GNU C++17' },
  { value: 'GNU_CPP20', label: 'GNU C++20' },
  { value: 'GNU_CPP23', label: 'GNU C++23' },
  { value: 'CLANG_CPP17', label: 'Clang C++17' },
  { value: 'CLANG_CPP20', label: 'Clang C++20' },
  { value: 'CLANG_CPP23', label: 'Clang C++23' },
];

type RunPhase = 'idle' | 'compiling' | 'running' | 'complete';
type ResultPanel = 'output' | 'diagnostics';
const playgroundStatuses = new Set<PlaygroundRunStatus>([
  'ACCEPTED',
  'COMPILE_ERROR',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'OUTPUT_LIMIT_EXCEEDED',
  'RUNNER_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

function loadDraft(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function statusLabel(status: PlaygroundRunStatus): string {
  return status.replaceAll('_', ' ');
}

function statusClass(status: PlaygroundRunStatus | undefined): string {
  return `status status-${status?.toLowerCase() ?? 'idle'}`;
}

function isPlaygroundRunResult(value: unknown): value is PlaygroundRunResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const result = value as Record<string, unknown>;
  return (
    typeof result.status === 'string' &&
    playgroundStatuses.has(result.status as PlaygroundRunStatus) &&
    typeof result.stdout === 'string' &&
    typeof result.stderr === 'string'
  );
}

export const App = () => {
  const [sourceCode, setSourceCode] = useState(() =>
    loadDraft('algoreflex:playground:code', DEFAULT_SOURCE)
  );
  const [stdin, setStdin] = useState(() => loadDraft('algoreflex:playground:stdin', ''));
  const [toolchainProfile, setToolchainProfile] = useState<ToolchainProfile>('GNU_CPP20');
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [result, setResult] = useState<PlaygroundRunResult>();
  const [activePanel, setActivePanel] = useState<ResultPanel>('output');
  const runSequence = useRef(0);
  const runRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    try {
      window.localStorage.setItem('algoreflex:playground:code', sourceCode);
      window.localStorage.setItem('algoreflex:playground:stdin', stdin);
    } catch {
      // Draft persistence is optional and must never prevent editing.
    }
  }, [sourceCode, stdin]);

  const run = useCallback(async () => {
    if (phase === 'compiling' || phase === 'running') {
      return;
    }

    const sequence = runSequence.current + 1;
    runSequence.current = sequence;
    setPhase('compiling');
    setResult(undefined);
    setActivePanel('output');
    const runningTimer = window.setTimeout(() => {
      if (runSequence.current === sequence) {
        setPhase('running');
      }
    }, 180);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/api/playground/run`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sourceCode, stdin, toolchainProfile }),
        }
      );
      const payload: unknown = await response.json().catch(() => undefined);
      if (runSequence.current !== sequence) {
        return;
      }
      if (!response.ok) {
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof payload.error === 'object' &&
          payload.error !== null &&
          'message' in payload.error &&
          typeof payload.error.message === 'string'
            ? payload.error.message
            : 'The playground run could not be completed.';
        setResult({
          status: 'RUNNER_UNAVAILABLE',
          stdout: '',
          stderr: '',
          runtimeDiagnostics: message,
        });
        setActivePanel('diagnostics');
        return;
      }

      if (!isPlaygroundRunResult(payload)) {
        setResult({
          status: 'INTERNAL_ERROR',
          stdout: '',
          stderr: '',
          runtimeDiagnostics: 'The runner returned an invalid response.',
        });
        setActivePanel('diagnostics');
        return;
      }
      setResult(payload);
      if (
        payload.status !== 'ACCEPTED' ||
        payload.compileDiagnostics ||
        payload.runtimeDiagnostics
      ) {
        setActivePanel('diagnostics');
      }
    } catch {
      if (runSequence.current === sequence) {
        setResult({
          status: 'RUNNER_UNAVAILABLE',
          stdout: '',
          stderr: '',
          runtimeDiagnostics: 'The API or secure runner is unavailable.',
        });
        setActivePanel('diagnostics');
      }
    } finally {
      window.clearTimeout(runningTimer);
      if (runSequence.current === sequence) {
        setPhase('complete');
      }
    }
  }, [phase, sourceCode, stdin, toolchainProfile]);

  runRef.current = () => {
    void run();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const running = phase === 'compiling' || phase === 'running';
  const shownStatus =
    phase === 'compiling'
      ? 'COMPILING'
      : phase === 'running'
        ? 'RUNNING'
        : result?.status;
  const diagnostics = [
    result?.compileDiagnostics,
    result?.runtimeDiagnostics,
    result?.stderr,
  ]
    .filter((value): value is string => Boolean(value))
    .join('\n');

  return (
    <div className="playground-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="AlgoReflex playground home">
          AlgoReflex
        </a>
        <div className="topbar-actions">
          <label className="profile-picker" htmlFor="toolchain-profile">
            <span className="sr-only">C++ toolchain profile</span>
            <select
              id="toolchain-profile"
              value={toolchainProfile}
              disabled={running}
              onChange={event =>
                setToolchainProfile(event.target.value as ToolchainProfile)
              }
            >
              {toolchainProfiles.map(profile => (
                <option key={profile.value} value={profile.value}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="run-button"
            type="button"
            disabled={running}
            onClick={() => void run()}
          >
            <span aria-hidden="true">▶</span>{' '}
            {running ? (phase === 'compiling' ? 'Compiling…' : 'Running…') : 'Run'}
            <kbd>Ctrl↵</kbd>
          </button>
        </div>
      </header>

      <main className="playground-main">
        <section className="editor-panel" aria-labelledby="editor-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Playground</p>
              <h1 id="editor-heading">main.cpp</h1>
            </div>
            <span className="language-chip">C++</span>
          </div>
          <div className="editor-frame">
            <Editor
              height="100%"
              language="cpp"
              theme="vs-dark"
              value={sourceCode}
              onChange={value => setSourceCode(value ?? '')}
              options={{
                ariaLabel: 'C++ source code editor',
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
                fontSize: 14,
                lineNumbersMinChars: 3,
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                tabSize: 4,
              }}
            />
          </div>
        </section>

        <section className="io-panel" aria-labelledby="stdin-heading">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">Input</p>
              <h2 id="stdin-heading">stdin</h2>
            </div>
            <span className="limit-hint">UTF-8 · 64 KB max</span>
          </div>
          <textarea
            aria-label="Standard input"
            className="stdin-input"
            value={stdin}
            onChange={event => setStdin(event.target.value)}
            placeholder="Provide input for your program…"
            spellCheck={false}
          />
        </section>

        <section className="result-panel" aria-labelledby="result-heading">
          <div className="result-heading">
            <div>
              <p className="eyebrow">Execution</p>
              <h2 id="result-heading">Result</h2>
            </div>
            <div className="status-wrap" aria-live="polite" aria-atomic="true">
              {shownStatus ? (
                <span className={statusClass(result?.status)}>
                  {statusLabel(shownStatus as PlaygroundRunStatus)}
                </span>
              ) : (
                <span className="status status-idle">Ready</span>
              )}
            </div>
          </div>

          <div className="result-tabs" role="tablist" aria-label="Result content">
            <button
              type="button"
              role="tab"
              aria-selected={activePanel === 'output'}
              className={activePanel === 'output' ? 'active' : ''}
              onClick={() => setActivePanel('output')}
            >
              Output
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePanel === 'diagnostics'}
              className={activePanel === 'diagnostics' ? 'active' : ''}
              onClick={() => setActivePanel('diagnostics')}
            >
              Diagnostics
            </button>
          </div>

          <pre
            className="result-content"
            tabIndex={0}
            aria-label={`${activePanel} result`}
          >
            {activePanel === 'output'
              ? result?.stdout ||
                (running
                  ? 'Waiting for runner output…'
                  : 'Run a program to see stdout here.')
              : diagnostics ||
                (running
                  ? 'Compilation and runtime diagnostics will appear here.'
                  : 'No diagnostics.')}
          </pre>

          <dl className="telemetry" aria-label="Execution telemetry">
            <div>
              <dt>Status</dt>
              <dd>
                {shownStatus ? statusLabel(shownStatus as PlaygroundRunStatus) : 'Ready'}
              </dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>
                {result?.executionTimeMs === undefined
                  ? '—'
                  : `${result.executionTimeMs} ms`}
              </dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>
                {result?.memoryUsedKb === undefined
                  ? '—'
                  : `${(result.memoryUsedKb / 1024).toFixed(1)} MB`}
              </dd>
            </div>
            <div>
              <dt>Exit code</dt>
              <dd>{result?.exitCode ?? '—'}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
};

export default App;
