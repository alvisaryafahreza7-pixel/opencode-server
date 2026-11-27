#!/usr/bin/env bash
# Wispbyte menjalankan file ini SEBELUM `npm install` generik.
# Kita pasang binary OpenCode langsung via curl+tar (tanpa npm), supaya tidak OOM.

# Wispbyte memanggil `sh deploy.sh`; paksa bash kalau belum bash.
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

BIN_DIR="$HOME/.opencode/bin"
mkdir -p "$BIN_DIR"

if [ -x "$BIN_DIR/opencode" ]; then
  echo "[deploy] OpenCode sudah terpasang: $($BIN_DIR/opencode --version 2>/dev/null || echo 'unknown')"
  exit 0
fi

# Pin versi supaya deploy tidak berubah-ubah. Bisa di-override lewat env OPENCODE_VERSION.
export VERSION="${OPENCODE_VERSION:-2.4.2}"

echo "[deploy] Mengunduh OpenCode v$VERSION (curl+tar, tanpa npm)..."
curl -fsSL https://opencode.ai/v2/install | bash -s -- --no-modify-path

command -v rg >/dev/null 2>&1 || echo "[deploy] catatan: 'rg' tidak ada; pencarian file mungkin lambat."
echo "[deploy] Selesai: $($BIN_DIR/opencode --version 2>/dev/null || echo 'opencode')"
