# Threat Model

Status: design document. Defenses are planned, not implemented. Each item will
be linked to tests as the code is written.

## Assets

- Availability and resources of the server (CPU, RAM) running the model.
- Accuracy of answers given in the name of the site owner.
- Confidentiality of visitor messages and of logs.
- Integrity of the knowledge base (FAQ and imported documents).
- Integrity of the host machine and of model files.

## Actors

- Anonymous visitor, possibly malicious.
- Automated abuser or scraper.
- Author of an imported document, who may be careless or malicious.
- Third-party website embedding the widget without permission.
- Site administrator, who is trusted but can misconfigure.

## Trust boundaries

1. Browser to server: everything from the widget is untrusted.
2. Knowledge base to prompt: retrieved text is untrusted data.
3. Server to `llama-server`: local only, bound to `127.0.0.1`.
4. Host to model files: files are verified before use.

## Threats and planned defenses

| ID | Threat | Planned defenses | Residual risk |
|---|---|---|---|
| T1 | Direct prompt injection by the visitor | Separate system, user and retrieved sections. Output validation. No tools and no write operations. | The model may still follow malicious text. Impact is limited to wrong or off-topic answers. |
| T2 | Indirect injection through FAQ or documents | Treat retrieved text as data. Size limits. Import only local files chosen by the admin. | A malicious document can still steer answers. Admins must review what they import. |
| T3 | Resource exhaustion and denial of service | Input and output limits, timeouts, rate limiting, fast rejection when the queue is full, separate inference concurrency limit. | Shared IPs and proxies make rate limits imprecise. A distributed attack can still saturate a small server. |
| T4 | XSS through chat content | Render messages as text, never as HTML. Strict handling of links. Widget tests with hostile payloads. | Bugs in future rendering features. |
| T5 | Use of the API by unauthorized origins | Origin allow list, closed by default. Documentation of limits. | Origin checks do not stop non-browser clients. Rate limits cover that case. |
| T6 | CSRF | No cookie-based sessions in the MVP. Stateless requests. | Changes if authentication is added later. |
| T7 | SSRF | The server makes no outbound requests except to the configured local inference endpoint, which must be a loopback address. No remote document fetching. | Future features that fetch URLs need a new review. |
| T8 | Exposure of the inference or admin endpoints | `llama-server` bound to loopback only. No admin HTTP endpoints in the MVP. Safe configuration defaults. | Misconfiguration by the administrator. |
| T9 | Leakage through logs | No message content in logs by default. Minimal, configurable retention. | Admins can enable verbose logging. |
| T10 | Malicious or unlicensed model files | Manual import. Checksum verification. Documented license review. No silent downloads. | Trust in the model publisher. |
| T11 | Dependency supply chain | Few dependencies, lockfile, audit in CI, license review. | New vulnerabilities after release. |
| T12 | Invented policies, prices or conditions | Grounded answers, evidence thresholds, explicit fallback and refusal. | Language models can still produce errors. Sensitive topics should be added to the FAQ explicitly. |
| T13 | Disclosure of system instructions | Assume prompts can leak. Never place secrets in prompts or knowledge files. | Instructions may be revealed. |

## Out of scope for the MVP

Visitor authentication, multi-tenant isolation, persistent storage of
conversations and protection against a fully compromised host.

## Validation plan

Each threat above gets automated tests where possible: hostile payloads for the
widget and API, oversized inputs, concurrency and queue limits, and a corpus of
prompt injection cases. Results and remaining gaps will be documented in
`docs/TESTING.md`.
