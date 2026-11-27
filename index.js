// Entry point untuk Wispbyte: node /home/container/${JS_FILE}
// JS_FILE = index.js (atau biarkan kosong; Node akan memakai index.js dari folder).
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const home = process.env.HOME || '/home/container';
const port = process.env.PORT || '3000';

// Satu password untuk semua: cukup isi OPENCODE_PASSWORD di panel.
// OPENCODE_SERVER_USERNAME / OPENCODE_SERVER_PASSWORD diisi otomatis kalau kosong.
const env = { ...process.env };
env.OPENCODE_SERVER_USERNAME ||= 'opencode';
const password = env.OPENCODE_PASSWORD || env.OPENCODE_SERVER_PASSWORD || '';
env.OPENCODE_PASSWORD = password;
env.OPENCODE_SERVER_PASSWORD = password;

// Cari binary: yang sudah di-install, sisa node_modules lama, atau pasang sendiri.
const candidates = [
  env.OPENCODE_BIN,
  path.join(home, '.opencode/bin/opencode'),
  path.join(home, 'node_modules/.bin/opencode'),
  path.join(home, 'node_modules/@opencode/cli/bin/opencode.exe'),
].filter(Boolean);

let bin = candidates.find((p) => fs.existsSync(p));
if (!bin) {
  console.log('[start] mengunduh OpenCode (curl+tar, tanpa npm)...');
  env.VERSION = env.VERSION || env.OPENCODE_VERSION || '2.4.2';
  const r = spawnSync(
    'bash',
    ['-c', 'curl -fsSL https://opencode.ai/v2/install | bash -s -- --no-modify-path'],
    { stdio: 'inherit', env },
  );
  if (r.status !== 0) {
    console.error('[start] gagal memasang opencode');
    process.exit(1);
  }
  bin = candidates.find((p) => fs.existsSync(p)) || path.join(home, '.opencode/bin/opencode');
}

const args = ['serve', '--hostname', '0.0.0.0', '--port', String(port)];
console.log(`[start] ${bin} ${args.join(' ')}`);
const child = spawn(bin, args, { stdio: 'inherit', env });

for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => child.kill(sig));
}
child.on('error', (err) => {
  console.error('[start] gagal menjalankan opencode:', err.message);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  process.exit(code == null ? (signal ? 1 : 0) : code);
});
