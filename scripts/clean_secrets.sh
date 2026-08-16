#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || -z "$1" ]]; then
  echo "Usage: $0 <remote-git-url> [replace-text-file]" >&2
  exit 2
fi

REMOTE_URL=$1
REPLACE_INPUT=${2:-"$(pwd)/scripts/replace-secrets.txt"}

if [[ ! -f "$REPLACE_INPUT" ]]; then
  echo "Error: replace-text file not found at $REPLACE_INPUT." >&2
  exit 3
fi

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "Error: git-filter-repo is required." >&2
  exit 4
fi

REPLACE_DIR=$(cd -- "$(dirname -- "$REPLACE_INPUT")" && pwd)
REPLACE_FILE="$REPLACE_DIR/$(basename -- "$REPLACE_INPUT")"
MIRROR_DIR=$(mktemp -d "${TMPDIR:-/tmp}/system-notes-mirror.XXXXXX")

echo "Creating mirror clone in: $MIRROR_DIR"
git clone --mirror -- "$REMOTE_URL" "$MIRROR_DIR"
cd -- "$MIRROR_DIR"

echo "Rewriting matching history with git-filter-repo..."
git filter-repo --replace-text "$REPLACE_FILE"

echo "Cleaning reflogs and unreachable objects..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo
echo "Repository cleaned locally at: $MIRROR_DIR"
echo "Rotate every exposed credential before updating the remote."
echo
echo "After verifying the mirror, the destructive full-history push is:"
echo "  cd $MIRROR_DIR"
echo "  LEFTHOOK=0 git push --force --mirror origin"
