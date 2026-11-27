// Entry point untuk Wispbyte: node /home/container/${JS_FILE}
// JS_FILE = index.js (atau biarkan kosong; Node akan memakai index.js dari folder).
const { spawn } = require('node:child_process');
const path = require('node:path');

const bin = process.env.OPENCODE_BIN || path.join(process.env.HOME || '/home/container', '.opencode/bin/opencode');
const port = process.env.PORT || '3000';
const args = ['serve', '--hostname', '0.0.0.0', '--port', String(port)];

console.log(`[start] ${bin} ${args.join(' ')}`);
const child = spawn(bin, args, { stdio: 'inherit', env: process.env });

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
