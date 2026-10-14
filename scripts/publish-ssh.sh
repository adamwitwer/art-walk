#!/usr/bin/env bash
# Run from Terminal when the agent's sandbox cannot access SSH or .git.
# Preserve the public repository's existing commits and all local working files.
set -euo pipefail
task_repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
task_repo_url='git@github.com:adamwitwer/art-walk.git'
cd -- "$task_repo_dir"

if [[ ! -d .git ]]; then
  git init -b main
fi

if [[ "$(git rev-parse --show-toplevel)" != "$task_repo_dir" ]]; then
  echo 'Refusing to publish from a different Git checkout.' >&2
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  task_origin_url="$(git remote get-url origin)"
  if [[ "$task_origin_url" != "$task_repo_url" && "$task_origin_url" != 'https://github.com/adamwitwer/art-walk.git' && "$task_origin_url" != 'https://github.com/adamwitwer/art-walk' ]]; then
    echo 'Refusing to change an origin that points to a different repository.' >&2
    exit 1
  fi
  git remote set-url origin "$task_repo_url"
else
  git remote add origin "$task_repo_url"
fi

git fetch origin main
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  if [[ "$(git branch --show-current)" != 'main' ]]; then
    echo 'Switch to main before running this script.' >&2
    exit 1
  fi
  git merge --ff-only origin/main
else
  # Establish the existing remote history without overwriting working files.
  git reset --mixed origin/main
fi

npm run check
git add -- .gitignore AGENTS.md README.md docs netlify.toml package.json public scripts tests
git diff --cached --check
if ! git diff --cached --quiet; then
  git commit -m 'Document content provenance and deployment workflow'
fi
git push --set-upstream origin main
git status --short
git log -1 --oneline
