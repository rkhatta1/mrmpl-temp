# Repository Agent Guidance

Package manager of choice: `bun`
Working directory: `./`

- the git commit command's format shall be: `git commit -m "title" -m "summary of changes"`
- find the skill `tdd` and follow the test driven development approach highlighted in that skill. if you don't find the said skill, don't bother.
- **Be smart with your choice of following `tdd` approach given a task; not every task requires an over engineered solution. trivial UI changes for example do not need 3 tests that validate the change. they would be much better "validated" by using the `agent-browser` to capture a snapshot and review that against the change/s implemented. prefer being quick with the implementation, especially when given a targeted request.**
- when the user demands a handoff doc, save it in this repo's `.handoff` directory. If it doesn't exist, create one.
- convex is a beast best tamed. often refer to the `convex-performance-audit` skill to verify the changes you make to the codebase, especially convex related code. use the `pnpm convex -h` cli to audit the I/O operations' sizes for a yard-stick of the code's performance.

## Codebase Knowledge Graph

This project uses `codebase-memory-mcp` to maintain a knowledge graph of the codebase. Always prefer MCP graph tools over grep, glob, or file search for code discovery.

Use this priority order:

1. `search_graph` to find functions, classes, routes, and variables.
2. `trace_path` to inspect callers and callees.
3. `get_code_snippet` to read a specific function or class.
4. `query_graph` for complex graph queries.
5. `get_architecture` for a high-level project summary.

Fall back to text search for string literals, error messages, configuration values, non-code files, or when the graph does not provide enough information.

## Git Discipline

- Commit the changes whenever a slice of work or a phase of plan is implemented AND reviewed by the user.
- If the user prompts to move on to the next phase/feature, that signals the completion of the previous phase/feature. Ensure committing the changes from the previous request before proceeding to work on the new request.
- If the user is reviewing the changes, asking you questions, voicing their concerns etc. - that means the feature/phase of work is in progress still.
- Be proactive in committing changes. Avoid large commits with massive changes and opt for smaller commits with unit task changes.

## Agent Working Memory

Use `./memory/` as the persistent working memory vault for local coding agents.

Before starting any non-trivial task:
- Read `./memory/README.md` or `./memory/index.md` if present.
- Check for task-relevant notes in `./memory/`.
- Treat memory as helpful context, not truth; verify important claims against the codebase.

When you learn something that future agents should know, update the memory vault. Store durable context such as:
- architecture notes
- domain rules
- decisions and tradeoffs
- known pitfalls
- debugging findings
- task handoffs
- recurring commands or workflows
- open questions

Keep memory files concise, human-readable Markdown. Prefer updating an existing relevant note over creating scattered new files. Include dates and code references when useful.

Do not store secrets, credentials, private keys, tokens, large command outputs, build artifacts, or temporary scratch notes in memory.

**Note: `./docs/` directory contains the docs for the project and not the working memory for agents. That is an important distinction. Read those, and if the business logic defers later on during development, feel free to update the docs accordingly. Be super strict with CRUD in docs as they are very important for this project's lifecycle.**

<!-- rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context usage by 60-90% with zero behavior change. If rtk has no filter for a command, it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /rtk-instructions -->