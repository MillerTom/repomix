# Repomix Project Context

## Project Overview

**Repomix** is a TypeScript-based CLI tool designed to pack an entire repository into a single, AI-friendly file (XML, Markdown, JSON, Plain Text, or SQL). It facilitates feeding codebases to Large Language Models (LLMs) for analysis, code review, and refactoring.

**Key Features:**
*   **AI-Optimized Output:** Formats codebases for easy AI consumption. Supports XML, Markdown, JSON, Plain Text, and **SQL INSERT** statements.
*   **Token Counting:** Estimates token usage (using `tiktoken`).
*   **Security:** Integrates `secretlint` to prevent leaking sensitive information.
*   **Code Compression:** Uses `web-tree-sitter` to strip implementation details and reduce token count.
*   **Git Awareness:** Respects `.gitignore`, includes git logs and diffs. Handles large repositories with an expanded 128MB buffer for Git operations.
*   **Smart Ignoring:** Built-in patterns to skip binary files, media assets, documentation, and agent-specific files (e.g., `.aider/`).

**Architecture:**
*   **CLI Entry Point:** `bin/repomix.cjs` which delegates to `src/cli/cliRun.ts`.
*   **Core Logic:** `src/core/` contains logic for file collection, packing, security checks, and metrics.
*   **Configuration:** Uses `repomix.config.json`. Default `maxFileSize` is **1MB** to prevent accidental bloat. Default output style is **all**.
*   **Library Usage:** Can be imported as a library (exports in `src/index.ts`).

## Building and Running

The project uses `npm` for dependency management and scripts.

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Build Project:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript code to `lib/` using `tsconfig.build.json`.

*   **Run Locally:**
    ```bash
    npm run repomix -- [args]
    ```
    This builds the project and runs the CLI executable.
    Example: `npm run repomix -- --version` or `npm run repomix -- src/`

*   **Run Tests:**
    ```bash
    npm run test
    ```
    Uses `vitest` for unit and integration tests.
    For coverage: `npm run test-coverage`

*   **Linting & Formatting:**
    The project uses multiple linters:
    ```bash
    npm run lint
    ```
    This runs:
    *   `biome check --write` (Formatting & Linting)
    *   `oxlint --fix` (Linting)
    *   `tsgo` (TypeScript checks)
    *   `secretlint` (Security checks)

*   **Docker:**
    ```bash
    docker build -t repomix .
    docker run -v .:/app -it --rm repomix [args]
    ```

## Development Conventions

*   **Language:** TypeScript (Node.js >= 20).
*   **Style:** Follows `biome` configuration. Run `npm run lint` before committing.
*   **Testing:** All new features should have corresponding tests in `tests/`.
*   **Commit Messages:** Should be clear and concise.
*   **Documentation:** Update `README.md` when adding features. The website is built from the README and other docs.
*   **Structure:**
    *   `src/cli/`: CLI specific logic (commands, actions).
    *   `src/core/`: Core business logic (packager, file handling).
    *   `src/config/`: Configuration loading and schemas.
    *   `src/shared/`: Shared utilities (logging, error handling).
