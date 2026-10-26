# Optimo Chatbot

Open source customer support and FAQ chatbot that can be embedded in any website.
The AI engine runs locally on a server you control, using `llama.cpp` and small
quantized GGUF models. No external AI APIs are required.

> Status: early development. Nothing here is production-ready yet.

## Components

- **Widget**: a lightweight JavaScript chat widget embedded with a script tag.
  It never runs the AI model in the visitor's browser.
- **Engine**: a TypeScript/Node.js HTTP server that retrieves answers from your
  FAQ and documents and calls a local `llama.cpp` process for inference.

## Principles

- Security by design: the MVP is read-only and treats the widget, user messages
  and retrieved documents as untrusted input.
- Answers are grounded in the configured knowledge. The bot admits when it has
  no evidence instead of inventing information.
- Native installation first (Linux). Docker is not required.
- Performance claims only after reproducible measurements.

## Documentation

Architecture, threat model, installation and configuration guides will be added
under `docs/` as the project evolves.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). The license of this
project does not change the licenses of AI models or third-party materials.
