# Architecture

Status: design document. Nothing described here is implemented yet. Everything
is marked as planned until code and tests exist.

## Goals

- Embeddable FAQ and customer support chatbot for any website.
- Inference runs locally on a server controlled by the site owner, using
  `llama.cpp` and small quantized GGUF models. No external AI APIs.
- Works on low-end hardware (reference: dual-core CPU without AVX2, under
  4 GiB of RAM). Nothing is promised about speed until it is measured.
- Security by design: read-only system, untrusted widget, untrusted documents.

## Non-goals for the MVP

Admin panel, visitor authentication, persistent conversation storage,
analytics, semantic search, model downloader, Windows and macOS support.
See [ROADMAP.md](ROADMAP.md).

## Overview

~~~text
Website visitor
   |
   |  <script> tag loads the widget
   v
Widget (browser)  ---- HTTPS ---->  Optimo server (Node.js, TypeScript)
                                      |  security   validation, limits, policy
                                      |  knowledge  FAQ and document retrieval
                                      |  inference  adapter and request queue
                                      |  telemetry  minimal logs and metrics
                                      v
                                    llama-server (llama.cpp), 127.0.0.1 only
                                      |
                                      v
                                    Local GGUF model file
~~~

## Components (planned)

| Component | Responsibility |
|---|---|
| widget | Chat UI embedded by a script tag. No model, no heavy computation. |
| server/http | Routes, request parsing, standardized errors, health check. |
| server/security | Input validation, rate limiting, CORS policy, prompt construction rules. |
| server/config | Validated configuration loaded at startup. Fails closed on errors. |
| server/knowledge | Loads FAQ and imported documents, lexical retrieval, evidence scoring. |
| server/inference | `InferenceEngine` interface, `llama.cpp` adapter, queue, timeouts. |
| server/telemetry | Logs without message content by default, minimal counters. |

## Request flow (planned)

1. The widget sends a message to `POST /v1/chat`. The server is stateless: the
   widget may send a bounded number of recent turns, and the server treats all
   of it as untrusted input.
2. The server validates size and shape, applies rate limits and checks the
   request origin against the configured allow list.
3. The knowledge module retrieves candidate passages and computes evidence
   signals.
4. The answer policy chooses one action: answer directly from a strong FAQ
   match, generate an answer from retrieved passages, ask for clarification,
   or return the configured fallback.
5. If generation is needed, the inference module queues the request. When the
   queue is full the server rejects it quickly instead of waiting.
6. The output is validated and returned in a stable JSON contract.

## Answer policy (planned)

- Answers are grounded in retrieved content. Lexical scores are a signal for
  routing, never proof that a statement is true.
- Thresholds for accept, clarify and refuse are configurable and tested.
- A strong FAQ match can be returned without calling the model. This saves CPU
  and memory on weak hardware and keeps answers verbatim.
- The model only rewrites or combines retrieved passages. When there is no
  sufficient evidence, the bot says so and does not invent policies, prices
  or conditions.
- Out-of-scope questions follow a configurable fallback.

## Inference integration (planned)

- `llama-server` runs as a separate process bound to `127.0.0.1`. The Node.js
  server talks to it over local HTTP through an `InferenceEngine` interface.
- A separate process isolates crashes and memory use and avoids native bindings
  that depend on Node.js versions. The runtime can be replaced behind the
  interface.
- Concurrency limit for inference is separate from the HTTP connection limit.
  Default is one concurrent inference, with a short bounded queue.
- Timeouts and cancellation are enforced. Inference failures return a controlled
  error and never take the HTTP server down.
- Model files are imported manually. No silent downloads. Weights are never
  committed to the repository.

## Trust boundaries

- The widget and everything it sends are untrusted.
- Retrieved FAQ and document text is data, not instructions. The prompt keeps
  system instructions, user message and retrieved content in separate sections.
- The `llama-server` port is never exposed outside the machine.
- The MVP has no tools and no write operations on external systems.

## Resource limits (planned, names not final)

| Limit | Purpose |
|---|---|
| max message length | Bound input size |
| max output tokens | Bound generation cost |
| request timeout | Bound latency |
| max concurrent inferences | Protect CPU and RAM |
| max queue length | Fail fast under load |
| max document size | Bound import cost |

## Key decisions

- `llama.cpp` as a separate local process, not embedded in Node.js.
- No database, queue service or cache in the MVP.
- Lexical retrieval first. Semantic search is an optional extension behind an
  interface.
- Stateless server and no persistent conversation history by default.
- Native Linux installation first. Docker is not required.

## Open questions

- HTTP framework: a small framework or `node:http` (decide with a written
  justification in the foundation phase).
- Streaming responses: depends on latency measurements on low-end hardware.
- Final repository layout: single package or npm workspaces.
- Which small models are viable for Portuguese: to be compared by size,
  quantization, license, RAM use and quality, using measurements.
