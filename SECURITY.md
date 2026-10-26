# Security Policy

## Status

Optimo Chatbot is in early development and has no released version yet. There
are no supported releases. Security reports are still welcome.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Use GitHub private vulnerability reporting: open the repository on GitHub, go
to the Security tab and choose "Report a vulnerability". Include the affected
component, steps to reproduce, the impact you observed and your environment.

This is a small project maintained on a best-effort basis. There is no
guaranteed response time, but reports are taken seriously and handled as
quickly as the maintainer can.

## Scope

In scope: the widget, the server, the inference adapter, the knowledge
loader, configuration handling and the project documentation.

Out of scope: vulnerabilities in `llama.cpp`, in AI model weights, in Node.js
or in third-party dependencies themselves. Please report those to their own
projects. Reports about how Optimo Chatbot uses them are in scope.

## Security principles

- The MVP is read-only. It does not execute code or change external systems.
- The widget and everything it sends are untrusted.
- Retrieved documents are data, not instructions.
- Secure defaults. Logs do not contain message content by default.
- Model weights are imported manually and never committed to the repository.

## Known limitations

Prompt injection cannot be fully eliminated. The project reduces the risk with
layered defenses and tests them, but cannot guarantee that a language model
will always follow its instructions. See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md)
for the threats, the planned defenses and the residual risks.
