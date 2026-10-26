# Contributing

Thank you for your interest in Optimo Chatbot.

## Project status

The project is in early development. The repository currently contains design
and security documentation. Code arrives in phases described in
[docs/ROADMAP.md](docs/ROADMAP.md). The most useful contributions right now are
reviews of the architecture and the threat model, risks we missed, and ideas
for tests.

## Reporting problems and ideas

- Bugs, questions and feature ideas: open a GitHub issue. Describe what you
  expected, what happened and how to reproduce it.
- Security problems: do not open a public issue. Follow
  [SECURITY.md](SECURITY.md).
- Conduct concerns: see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Development workflow

1. Create a short-lived branch from `main`, for example `feat/faq-loader`,
   `fix/queue-limit` or `docs/installation`.
2. Make small, focused commits using Conventional Commits:
   - `feat:` new functionality
   - `fix:` bug fix
   - `docs:` documentation only
   - `test:` tests only
   - `refactor:` code change without behavior change
   - `perf:` performance improvement
   - `security:` security hardening
   - `chore:` maintenance and tooling
3. Before every commit, review `git status` and the diff. Never commit secrets,
   `.env` files, model weights (GGUF files), logs or local data.
4. Run the tests, linter and type check. The exact commands will be documented
   in `docs/TESTING.md` once the code exists.
5. Open a pull request against `main`. Describe what changed, why, how you
   tested it and what the security impact is.

## Pull request checklist

- Tests were added or updated. Tests must not require downloading a model.
- Documentation was updated where behavior changed.
- No new dependency without a short justification: purpose, license,
  maintenance status and size.
- No security default was weakened without prior discussion.
- The change does not add telemetry, tracking or mandatory external services.

## Language

Code, comments, documentation and commit messages are written in English.
Issues and discussions may be in English or Portuguese.

## Licensing

By submitting a contribution you agree that it is licensed under the
Apache License 2.0, as described in section 5 of the [LICENSE](LICENSE) file.
Do not add model weights or third-party material with incompatible licenses to
the repository.
