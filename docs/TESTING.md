# Testing

Status: design document. There are no tests, no CI workflow and no benchmark
results yet. Commands to run tests will be added here when the tooling exists,
in the foundation phase of the [roadmap](ROADMAP.md).

## Principles

- The CI never downloads a model. Common tests use mocks and small fixtures.
- Real inference is covered only by separate, documented benchmarks.
- Security tests are part of the normal test suite, not a late extra step.
- A test or measurement is reported only after it was actually run. No result is
  invented or estimated.

## Test levels (planned)

| Level | What it covers | Needs a model |
|---|---|---|
| Unit | Configuration and input validation, retrieval scoring, answer policy thresholds | No |
| API contract | Endpoints, error format, input limits, rate limiting, queue and concurrency behavior with a fake inference engine | No |
| Inference adapter | Timeouts, malformed output, crashes and cancellation, against a fake llama-server | No |
| Security | Hostile inputs, prompt injection cases, script payloads in chat messages, oversized input, origin checks | No |
| Widget | Rendering, loading and error states, restart, responsive layout, bundle size check | No |
| End to end | Widget, server and mock engine working together | No |
| Benchmarks | Latency, throughput and memory with a real local model | Yes, run manually |

## Security tests (planned)

Each threat in [THREAT_MODEL.md](THREAT_MODEL.md) gets automated tests where
possible:

- T1, T2: a corpus of injection attempts in visitor messages and in FAQ or
  document content. The tests check that retrieved text stays in its own data
  section of the prompt, that outputs are validated and that no tool or write
  action exists. They cannot prove that a language model will always follow its
  instructions, so residual risk remains and is documented.
- T3: input and output limits, timeouts, rate limiting, full queue rejected fast
  and the inference concurrency limit.
- T4: hostile payloads rendered as plain text in the widget.
- T5: requests from origins that are not on the allow list.
- T6, T7, T8: configuration that tries to widen exposure, such as a non-loopback
  inference address, is rejected. The server makes no other outbound requests.
- T9: logs contain no message content by default.
- T10: a model file with a wrong checksum is rejected.
- T11: lockfile and dependency audit in CI.
- T12: questions without evidence in the FAQ fixtures lead to the fallback or a
  clarification request, never an invented answer.
- T13: no secret appears in prompts or knowledge fixtures.

## Continuous integration (planned)

GitHub Actions, not configured yet: lint, format check, type check, unit and
integration tests, build, widget size report and dependency audit. No step needs
a model or a large download.

## Benchmark methodology

Benchmarks are separate from CI and run manually with a real model.

What is measured:

- Widget size, gzip compressed, reported from the real build output.
- Startup time of the server and of the model.
- End to end latency, reported as median and 95th percentile, and generation
  speed in tokens per second.
- Peak memory use, including whether the system started using swap.
- Behavior with several simultaneous requests. HTTP connections and running
  inferences are different things and are reported separately. The first
  scenario is five simultaneous requests, adjusted to the hardware afterwards.
- Error rate under load.

Conditions:

- Warm-up runs are discarded. Each scenario is repeated and the spread is
  reported along with the median.
- The same fixed set of questions is used between runs, so results are
  comparable.
- Unneeded applications are closed during a run, and this is noted.

Every result must record:

- Hardware: CPU model, cores and instruction sets, RAM and swap.
- Operating system and kernel, and Node.js version.
- `llama.cpp` version and build options.
- Model name, source, quantization, file checksum and license.
- Inference parameters: context size, threads and maximum output tokens.
- Optimo Chatbot commit and the date of the run.

Results will be published in the repository, with this information and the
raw data, in a document created together with the first measurements.

## What exists today

Nothing in this document has been run yet.
