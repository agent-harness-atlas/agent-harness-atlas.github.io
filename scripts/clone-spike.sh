#!/usr/bin/env bash
# Shallow-clone the 6 open-source agent repos for source grounding.
# Closed-source (claude-code, cursor) are docs-basis — not cloned.
set -u
DEST="/tmp/agent-src-spike"
mkdir -p "$DEST"
clone() {
  local id="$1" url="$2"
  if [ -d "$DEST/$id/.git" ]; then
    echo "[$id] already cloned: $(git -C "$DEST/$id" remote get-url origin 2>/dev/null) @ $(git -C "$DEST/$id" rev-parse --short HEAD 2>/dev/null)"
    return 0
  fi
  echo "[$id] cloning $url ..."
  if timeout 180 git clone --depth 1 --single-branch -q "$url" "$DEST/$id" 2>&1; then
    echo "[$id] DONE @ $(git -C "$DEST/$id" rev-parse --short HEAD 2>/dev/null) size=$(du -sh "$DEST/$id" 2>/dev/null | cut -f1)"
  else
    echo "[$id] FAILED (exit $?)"
  fi
}
clone codex        https://github.com/openai/codex.git
clone pi           https://github.com/earendil-works/pi.git
clone opencode     https://github.com/sst/opencode.git
clone aider        https://github.com/Aider-AI/aider.git
clone cline        https://github.com/cline/cline.git
clone gemini-cli   https://github.com/google-gemini/gemini-cli.git
echo "=== ALL CLONES COMPLETE ==="
ls -la "$DEST"
