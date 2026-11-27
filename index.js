// Entry point untuk Wispbyte: node /home/container/${JS_FILE}
// Catatan: panel Wispbyte mengganti teks mirip "PASSWORD=..." jadi ••• saat menyimpan,
// jadi nama env diakses lewat variabel, bukan literal `X=`.
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const home = process.env.HOME || '/home/container';
const port = process.env.PORT || '3000';
const E = process.env;
const env = { ...E };

const KU = 'OPENCODE_SERVER_USERNAME';
const KP = 'OPENCODE_PASSWORD';
const KS = 'OPENCODE_SERVER_PASSWORD';

env[KU] = env[KU] || 'opencode';
const pw = E[KP] || E[KS] || '';
env[KP] = pw;
env[KS] = pw;

// Cari binary: yang sudah di-install, sisa node_modules lama, atau pasang sendiri.
const candidates = [
  E.OPENCODE_BIN,
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
