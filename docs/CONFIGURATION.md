# Configuration

Status: design document. Nothing described here is implemented yet. Setting
names and defaults are provisional and will be finalized, tested and documented
in the foundation phase of the [roadmap](ROADMAP.md).

## Principles

- Configuration is file based and managed with the command line. There is no
  admin panel in the MVP.
- The configuration is validated at startup. Invalid, unknown or unsafe values
  stop the server with a clear error. It never starts in a partially valid state.
- Defaults are secure. Anything that widens exposure must be set explicitly.
- Secret values never belong in the repository. The MVP is planned to need no
  secrets. If one is added later, it will be read from the environment or from a
  file outside the repository.
- Model files and local data live outside the repository and are ignored by Git.
- The widget is an untrusted client. Its settings control appearance only, and
  the server never uses values sent by the browser to grant access.

## Format

The file format is an open decision. JSON needs no extra dependency. YAML is
easier to read and write but needs a parser. The choice will be made in the
foundation phase and documented with its justification.

## Settings (provisional)

### Server

| Setting | Purpose | Planned default |
|---|---|---|
| host | Address the HTTP server listens on | 127.0.0.1, to be confirmed |
| port | Port of the HTTP server | to be decided |
| allowedOrigins | Origins allowed to call the API (CORS) | empty list, closed by default |
| trustedProxies | Proxies whose forwarded client address is trusted | none |

### Limits

| Setting | Purpose | Planned default |
|---|---|---|
| maxMessageChars | Maximum size of one visitor message | to be measured |
| maxHistoryTurns | Recent turns the widget may send | small, to be decided |
| maxOutputTokens | Maximum length of a generated answer | low, to be measured |
| requestTimeoutMs | Time limit for a whole request | to be measured |
| maxConcurrentInferences | Inferences running at the same time | 1 |
| maxQueueLength | Requests waiting for inference before rejection | short, to be measured |
| rateLimit | Requests allowed per origin or session in a time window | enabled, values to be decided |

### Knowledge

| Setting | Purpose | Planned default |
|---|---|---|
| faqPath | Location of the FAQ file | required |
| documentsDir | Directory of imported documents | none |
| maxDocumentBytes | Maximum size of an imported document | to be decided |
| evidenceThresholds | Limits to answer, ask for clarification or refuse | conservative, covered by tests |
| fallbackMessage | Text returned when there is no sufficient evidence | neutral built-in text, customizable |

### Inference

| Setting | Purpose | Planned default |
|---|---|---|
| llamaServerUrl | Address of the local llama-server | loopback only, other hosts rejected |
| modelPath | Location of the GGUF model file | required, outside the repository |
| modelSha256 | Expected checksum of the model file | verified at startup, details to be decided |
| contextSize | Context window used by the model | small, measured against available RAM |

### Logging

| Setting | Purpose | Planned default |
|---|---|---|
| logLevel | Amount of detail in the logs | info |
| logMessageContent | Whether visitor messages are written to logs | false |
| retentionDays | How long logs are kept | minimal, to be decided |

### Widget

| Setting | Purpose | Planned default |
|---|---|---|
| apiUrl | Address of the Optimo server | required |
| name | Name shown in the chat window | neutral built-in text |
| primaryColor | Main color of the interface | neutral gray |
| greeting | First message shown to the visitor | neutral built-in text |
| position | Corner of the screen where the widget appears | to be decided |

## Validation and failure behavior

- Unknown settings are rejected, so typos are not silently ignored.
- Values outside safe ranges are rejected. Examples: a non-loopback inference
  address, a missing model file, a checksum mismatch.
- Error messages name the setting and the problem, and never print secret values.

## Open questions

- File format: JSON or YAML.
- Final setting names, units and defaults, after measurements on low-end
  hardware.
- How to override settings from the environment, if at all.
- How the widget receives its settings: script tag attributes, a configuration
  object or both.
