import {
  PlaygroundRunResultSchema,
  type PlaygroundRunRequest,
  type PlaygroundRunResult,
} from '@algoreflex/contracts';

export interface RunnerGateway {
  run(request: PlaygroundRunRequest): Promise<PlaygroundRunResult>;
}

export class RunnerUnavailableError extends Error {
  public constructor() {
    super('Runner service unavailable');
    this.name = 'RunnerUnavailableError';
  }
}

/**
 * The API speaks only to the runner's internal HTTP contract. It never imports
 * Docker orchestration or executes code itself.
 */
export class HttpRunnerGateway implements RunnerGateway {
  private readonly baseUrl: string;
  private readonly accessToken: string | undefined;
  private readonly timeoutMs: number;

  public constructor(
    options: {
      baseUrl?: string;
      accessToken?: string;
      timeoutMs?: number;
    } = {}
  ) {
    this.baseUrl =
      options.baseUrl ?? process.env['RUNNER_SERVICE_URL'] ?? 'http://127.0.0.1:4050';
    this.accessToken = options.accessToken ?? process.env['RUNNER_SHARED_TOKEN'];
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  public async run(request: PlaygroundRunRequest): Promise<PlaygroundRunResult> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/playground/run`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.accessToken ? { authorization: `Bearer ${this.accessToken}` } : {}),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) {
        throw new RunnerUnavailableError();
      }
      return PlaygroundRunResultSchema.parse(await response.json());
    } catch {
      throw new RunnerUnavailableError();
    }
  }
}
