# Active Tasks

Current Milestone: **M1 — C++ Playground & Secure Runner**

## M1 Delivery Tasks (In Progress)

- [x] **M1-CON-01**: Define strict public playground run request/result schemas with bounded UTF-8 source/stdin and non-leaking statuses.
- [x] **M1-API-01**: Add the rate-limited `POST /api/playground/run` gateway, with API-to-runner separation and no host execution path.
- [x] **M1-RUN-01**: Replace the M0 stub with the Linux rootless-Docker two-stage compile/execution sandbox lifecycle.
- [x] **M1-RUN-02**: Enforce trusted toolchain profiles, separate compile/execution resource limits, diagnostic sanitization, output caps, and sandbox teardown.
- [x] **M1-WEB-01**: Add a responsive Monaco C++ playground with stdin, Run shortcut, result panels, status states, and local draft persistence.
- [x] **M1-TEST-01**: Add deterministic contract/API/runner tests and an opt-in Linux sandbox threat suite.
- [x] **M1-DOC-01**: Document local Linux/WSL2 runner setup, security controls, and integration-test prerequisites.
- [ ] **M1-REV-01**: Run sandbox integration tests in a Linux host with rootless Docker and an approved runner image, then record results in the pull request.
