// Entry point untuk Wispbyte: node /home/container/${JS_FILE}
// Catatan: panel Wispbyte mengganti teks mirip "NAMA=nilai" jadi titik-titik saat menyimpan,
// jadi nama env diakses lewat variabel, bukan literal dengan tanda sama-dengan.
const { spawn, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const home = process.env.HOME || '/home/container';
const port = process.env.PORT || '3000';
const E = process.env;
const env = { ...E };

const KU = 'OPENCODE_SERVER_USERNAME';
const KP = 'OPENCODE_PASSWORD';
const KS = 'OPENCODE_SERVER_PASSWORD';

// Password: env kalau panel benar-benar mengirimnya, kalau tidak pakai file
// supaya tetap sama tiap restart (tanpa env, OpenCode bikin acak tiap boot).
const pwFile = path.join(home, '.opencode', 'server-password');
let pw = E[KP] || E[KS] || '';
if (!pw) {
  try {
    pw = fs.readFileSync(pwFile, 'utf8').trim();
  } catch {}
}
if (!pw) {
  pw = crypto.randomBytes(36).toString('base64url');
  try {
    fs.mkdirSync(path.dirname(pwFile), { recursive: true });
    fs.writeFileSync(pwFile, pw, { mode: 0o600 });
  } catch (err) {
    console.error('[start] peringatan: tidak bisa menyimpan password:', err.message);
  }
}

env[KU] = env[KU] || 'opencode';
env[KP] = pw;
env[KS] = pw;

// /tmp di container ini kecil, download 80MB gagal di ~80% (curl 23).
// Pindahkan temp instal ke home, lalu buang sisa download yang menumpuk.
const tmp = path.join(home, 'tmp');
try {
  fs.mkdirSync(tmp, { recursive: true });
  env.TMPDIR = tmp;
} catch {}
for (const dir of ['/tmp', tmp]) {
  try {
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith('opencode_install_') || f.startsWith('opencode-install-')) {
        fs.rmSync(path.join(dir, f), { recursive: true, force: true });
      }
    }
  } catch {}
}

// Cari binary: yang sudah di-install, sisa node_modules, atau pasang sendiri.
const candidates = [
  E.OPENCODE_BIN,
  path.join(home, '.opencode/bin/opencode'),
  path.join(home, 'node_modules/@opencode/cli/bin/opencode.exe'),
  path.join(home, 'node_modules/.bin/opencode'),
].filter(Boolean);

let bin = candidates.find((p) => {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
});

if (!bin) {
  for (const p of [
    path.join(home, 'node_modules'),
    path.join(home, 'package-lock.json'),
    path.join(home, 'node_modules/.package-lock.json'),
  ]) {
    try {
      fs.rmSync(p, { recursive: true, force: true });
    } catch {}
  }
  console.log('[start] mengunduh OpenCode ke', tmp, '(bukan /tmp)...');
  env.VERSION = env.VERSION || env.OPENCODE_VERSION || '2.4.2';
  const r = spawnSync(
    'bash',
    ['-c', 'curl -fsSL https://opencode.ai/v2/install | bash -s -- --no-modify-path'],
    { stdio: 'inherit', env },
  );
  if (r.status !== 0) {
    console.error('[start] gagal memasang opencode, status:', r.status);
    process.exit(1);
  }
  bin = candidates.find((p) => fs.existsSync(p)) || path.join(home, '.opencode/bin/opencode');
  if (!fs.existsSync(bin)) {
    console.error('[start] binary tidak ditemukan setelah instal:', bin);
    process.exit(1);
  }
}

const args = ['serve', '--hostname', '0.0.0.0', '--port', String(port)];
console.log(`[start] ${bin} ${args.join(' ')}`);
console.log(`[start] password: ${pw}   (file: ${pwFile})`);
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
