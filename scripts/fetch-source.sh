#!/usr/bin/env bash
# Vercel build step: pull the site source straight from GitHub and stage the
# static files in public/. Used because the Vercel project isn't linked to the
# repo through the Git integration. Functions in api/ are uploaded alongside.
#
#   SOURCE_REPO   owner/name            (default quickitsaj/districtnerds)
#   SOURCE_REF    branch, tag or sha    (default claude/beautiful-wright-ho8w8o)
#   GITHUB_TOKEN  optional read token   (needed only while the repo is private)
set -euo pipefail
REPO="${SOURCE_REPO:-quickitsaj/districtnerds}"
REF="${SOURCE_REF:-claude/beautiful-wright-ho8w8o}"
SRC="$(mktemp -d)"
auth=()
if [ -n "${GITHUB_TOKEN:-}" ]; then auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}"); fi
echo "Fetching ${REPO}@${REF}"
curl -fsSL "${auth[@]}" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${REPO}/tarball/${REF}" | tar -xz -C "$SRC" --strip-components=1
rm -rf public && mkdir -p public
cp -R "$SRC/index.html" "$SRC/css" "$SRC/js" "$SRC/assets" public/
echo "Staged $(find public -type f | wc -l) files from ${REPO}@${REF}"
