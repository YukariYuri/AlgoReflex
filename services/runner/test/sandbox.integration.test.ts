import { describe, expect, it } from 'vitest';
import { DockerSandboxRunner } from '../src/docker-sandbox-runner.js';
import { DEFAULT_SANDBOX_RUNNER_CONFIG } from '../src/types.js';

const integrationEnabled = process.env['RUN_SANDBOX_INTEGRATION'] === 'true';
const runner = new DockerSandboxRunner({
  ...DEFAULT_SANDBOX_RUNNER_CONFIG,
  image: process.env['RUNNER_IMAGE'] ?? DEFAULT_SANDBOX_RUNNER_CONFIG.image,
  requireRootlessDocker: process.env['RUNNER_REQUIRE_ROOTLESS'] !== 'false',
});

describe.skipIf(!integrationEnabled)(
  'sandbox integration tests (set RUN_SANDBOX_INTEGRATION=true on Linux with the runner image)',
  () => {
    it('compiles and executes Hello World with stdin', async () => {
      const result = await runner.run({
        sourceCode:
          '#include <iostream>\nint main() { std::string s; std::cin >> s; std::cout << s; }',
        stdin: 'hello\n',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(result).toMatchObject({ status: 'ACCEPTED', stdout: 'hello', exitCode: 0 });
    });

    it('returns real compiler diagnostics for invalid source', async () => {
      const result = await runner.run({
        sourceCode: '#include <iostream>\nint main() { std::cout << "Hello" }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(result.status).toBe('COMPILE_ERROR');
      expect(result.compileDiagnostics).toContain('main.cpp');
      expect(result.compileDiagnostics).not.toContain('/sandbox/source');
    });

    it('classifies runtime errors, wall timeout, memory pressure, and output floods', async () => {
      const runtime = await runner.run({
        sourceCode: 'int main() { int* p = nullptr; return *p; }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(runtime.status).toBe('RUNTIME_ERROR');

      const timeout = await runner.run({
        sourceCode: 'int main() { while (true) {} }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(timeout.status).toBe('TIME_LIMIT_EXCEEDED');

      const output = await runner.run({
        sourceCode:
          '#include <iostream>\nint main() { while (true) std::cout << "AAAAAAAAAAAAAAAA"; }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(output.status).toBe('OUTPUT_LIMIT_EXCEEDED');

      const memory = await runner.run({
        sourceCode:
          '#include <vector>\nint main() { std::vector<int> x; while (true) x.resize(x.size() + 1000000); }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(memory.status).toBe('MEMORY_LIMIT_EXCEEDED');
    }, 30_000);

    it('prevents process growth, reachable networking, and host filesystem reads', async () => {
      const processAbuse = await runner.run({
        sourceCode:
          '#include <unistd.h>\nint main() { while (fork() >= 0) {} return 0; }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(processAbuse.status).not.toBe('ACCEPTED');

      const network = await runner.run({
        sourceCode: `#include <arpa/inet.h>
#include <sys/socket.h>
int main() { int s = socket(AF_INET, SOCK_STREAM, 0); sockaddr_in a{}; a.sin_family = AF_INET; a.sin_port = htons(53); inet_pton(AF_INET, "1.1.1.1", &a.sin_addr); return connect(s, (sockaddr*)&a, sizeof(a)) == -1 ? 0 : 1; }`,
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(network).toMatchObject({ status: 'ACCEPTED', exitCode: 0 });

      const filesystem = await runner.run({
        sourceCode:
          '#include <fstream>\nint main() { std::ifstream f("/etc/passwd"); return f.good() ? 1 : 0; }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
      });
      expect(filesystem).toMatchObject({ status: 'ACCEPTED', exitCode: 0 });
    }, 30_000);
  }
);
