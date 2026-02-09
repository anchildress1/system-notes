#!/usr/bin/env bash
set -euo pipefail

################################################################################
# clean_secrets.sh
# Create a disposable mirror clone, remove/replace secrets from history using
# git-filter-repo (preferred) or BFG, and show the exact force-push command to
# run. This script DOES NOT push by default — you must run the final push
# yourself (we recommend doing rotate/replace of keys first).
#
# Usage:
#   ./scripts/clean_secrets.sh git@github.com:anchildress1/system-notes.git
#
################################################################################

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <remote-git-url> [replace-text-file]"
  exit 2
fi

REMOTE_URL="$1"
REPLACE_FILE="${2:-$(pwd)/scripts/replace-secrets.txt}"

TMPDIR="/tmp/system-notes-mirror-$$"

echo "Creating mirror clone in: $TMPDIR"
git clone --mirror "$REMOTE_URL" "$TMPDIR"
cd "$TMPDIR"

echo "Found replace file: $REPLACE_FILE"
if [ ! -f "$REPLACE_FILE" ]; then
  echo "Warning: replace-text file not found at $REPLACE_FILE. Create it with lines like: secret==>[REDACTED]"
fi

if command -v git-filter-repo >/dev/null 2>&1; then
  echo "Using git-filter-repo to rewrite history..."
  if [ -f "$REPLACE_FILE" ]; then
    git filter-repo --replace-text "$REPLACE_FILE"
  else
    echo "No replace file provided. Use --invert-paths or provide patterns. Exiting."
    exit 3
  fi
else
  echo "git-filter-repo not found. Trying BFG if available..."
  if command -v java >/dev/null 2>&1 && [ -f "/usr/local/bin/bfg.jar" -o -f "./bfg.jar" ]; then
    BFG_JAR="$( [ -f ./bfg.jar ] && echo ./bfg.jar || echo /usr/local/bin/bfg.jar )"
    echo "Using BFG at: $BFG_JAR"
    if [ -f "$REPLACE_FILE" ]; then
      java -jar "$BFG_JAR" --replace-text "$REPLACE_FILE" .
    else
      echo "No replace file provided for BFG. Exiting."
      exit 4
    fi
  else
    echo "Neither git-filter-repo nor BFG available. Install git-filter-repo (pip/brew) or provide bfg.jar. Exiting."
    exit 5
  fi
fi

echo "Cleaning reflogs and running aggressive GC..."
git reflog expire --expire=now --all || true
git gc --prune=now --aggressive || true

echo
echo "Repository cleaned locally at: $TMPDIR"
echo "IMPORTANT: You MUST rotate any credentials found (API keys, tokens, certs)."
echo
echo "To push the cleaned history to remote (destructive):"
echo "  cd $TMPDIR"
echo "  LEFTHOOK=0 git push --force --mirror origin"
echo
echo "If you prefer to only update a single branch, push explicitly e.g.:"
echo "  LEFTHOOK=0 git push --force origin refs/heads/main:refs/heads/main"

echo "Script complete. Verify cleaned history locally before pushing."
