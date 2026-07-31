#!/usr/bin/env bash

set -euo pipefail

readonly NODE_VERSION="24"
if [[ -n "${CODEX_REPO_ROOT:-}" ]]; then
  REPO_ROOT="$CODEX_REPO_ROOT"
else
  REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
fi
readonly REPO_ROOT
readonly LOCAL_BIN="$HOME/.local/bin"
readonly LOCAL_BIN_PATH_EXPORT="export PATH=\"\$HOME/.local/bin:\$PATH\""

if [[ ! -f "$REPO_ROOT/package.json" ]]; then
  echo "Codex repository root does not contain package.json: $REPO_ROOT" >&2
  exit 1
fi

cd "$REPO_ROOT"

mkdir -p "$LOCAL_BIN"
export PATH="$LOCAL_BIN:$PATH"
if ! grep -Fqx "$LOCAL_BIN_PATH_EXPORT" "$HOME/.bashrc" 2>/dev/null; then
  printf '\n%s\n' "$LOCAL_BIN_PATH_EXPORT" >> "$HOME/.bashrc"
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "Codex universal image did not provide nvm at $NVM_DIR." >&2
  exit 1
fi

# Keep the latest patch release in the project's Node major current on both
# fresh containers and resumed caches.
# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
nvm use "$NODE_VERSION"

package_manager="$(node -p "require('./package.json').packageManager")"
if [[ "$package_manager" != bun@* ]]; then
  echo "Expected packageManager to be pinned to bun, got: $package_manager" >&2
  exit 1
fi

bun_version="${package_manager#bun@}"
mise install "bun@$bun_version"
mise use --global "bun@$bun_version"
hash -r

echo "Installing or updating RTK."
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
rtk --version

echo "Installing or updating codebase-memory-mcp."
curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash
codebase-memory-mcp --version

echo "Using Node $(node --version) and Bun $(bun --version)."
bun install --frozen-lockfile
