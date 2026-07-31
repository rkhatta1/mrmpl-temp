#!/usr/bin/env bash

set -euo pipefail

readonly NODE_VERSION="24"
readonly REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "Codex universal image did not provide nvm at $NVM_DIR." >&2
  exit 1
fi

# Keep the latest patch release in the project's Node major current on both
# fresh containers and resumed caches.
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

echo "Using Node $(node --version) and Bun $(bun --version)."
bun install --frozen-lockfile
