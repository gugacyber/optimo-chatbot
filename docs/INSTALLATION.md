# Installation

Status: planning. There is nothing to install yet. This page records the
requirements already known and the planned installation flow. It will be
rewritten with tested commands as each phase of the [roadmap](ROADMAP.md) lands.

## Supported platforms

Linux first. The project is developed on Fedora. Windows and macOS are not
supported and have not been tested.

## Prerequisites (planned)

- Node.js, current LTS release. The minimum supported version will be defined in
  the foundation phase. Development currently uses Node.js 22.
- Git.
- A C/C++ toolchain and CMake, to build `llama.cpp` from source.
- A GGUF model file that you obtain yourself (see Models below).
- Docker is not required.
- A GPU is not required. CPU-only is the baseline.

You can check the tools you already have:

~~~bash
node --version
git --version
cmake --version
g++ --version
~~~

## Planned installation flow

1. Get the source code from the repository.
2. Install the Node.js dependencies.
3. Build `llama.cpp` for your CPU. The exact steps and options will be
   documented in the inference phase, after being tested.
4. Import a model manually: choose it, review its license, verify its checksum
   and place it in the configured directory outside the repository.
5. Create a configuration file from the provided example. See
   [CONFIGURATION.md](CONFIGURATION.md).
6. Start `llama-server` bound to `127.0.0.1` and the Optimo server.
7. Add the widget to your website with a script tag.

## Models

Model weights are never distributed with this project and are never committed
to the repository. Importing is a manual step: nothing is downloaded silently.
Before using a model, review its license and redistribution terms, and verify
the checksum published by its source. The Apache-2.0 license of this project does
not change the license of any model.

Small quantized models are the target. Memory use, speed and answer quality in
Portuguese will be measured and documented. Nothing is claimed about a specific
model or machine before it is tested.

## Offline operation

After the dependencies and the model are installed, running the chatbot does
not require an internet connection. Updates and downloads are separate
operations from inference.

## Notes on security and hardware

- Do not run scripts you have not reviewed, and avoid `sudo` unless a step
  explicitly requires it. The server is planned to run as an unprivileged user.
- `llama-server` must listen only on `127.0.0.1`. See
  [THREAT_MODEL.md](THREAT_MODEL.md).
- Low-end hardware is a design target (reference: dual-core CPU without AVX2 and
  under 4 GiB of RAM). Expect modest speed on such machines. Real measurements
  will be published instead of assumptions.
