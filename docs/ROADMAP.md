# Roadmap

Status: planning. Items move to "done" only when code, tests and documentation
exist and have been verified.

## MVP (v0.1)

- Repository, license and project documentation.
- Node.js and TypeScript foundation: tests, lint, formatting, type checking, CI.
- Validated configuration file.
- HTTP API: `POST /v1/chat`, health check, standardized errors, input limits,
  rate limiting.
- Knowledge: FAQ loading with fictional example data, lexical retrieval,
  evidence-based answer policy, uncertainty handling.
- Local inference through `llama.cpp` behind an isolated interface, with
  timeouts, queue and concurrency limits. Tests use mocks.
- Widget: open and close, messages, loading state, errors, restart, responsive
  layout, configurable name, color, greeting and position, script tag
  integration. Bundle size is measured and reported.
- Security tests: malicious input and prompt injection cases.
- Separate, documented benchmarks with a real model: latency, throughput, RAM
  and error rate under load.
- Initial release only after the release criteria are met.

## Later

- Semantic retrieval as an optional module.
- Model downloader with license confirmation and checksum verification.
- Streaming responses, if measurements justify them.
- Document import formats beyond plain structured files.
- Optional visitor authentication through an explicit integration with the host
  site.
- Optional persistent storage and analytics, with minimal retention.
- Windows and macOS support after testing.
- Optional GPU acceleration, after testing.

## Not planned

- Sending visitor data to external AI services.
- Invasive tracking or mandatory proprietary services.
- Write operations on external systems from the chatbot.
