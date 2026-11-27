# OpenCode server (self-host)

Server OpenCode v2 (`opencode serve`) siap di-deploy ke hosting Docker/PaaS atau VPS.
Isi folder ini: `Dockerfile`, `docker-compose.yml`, `.env.example`, `vps/opencode.service`, `vps/Caddyfile`.

Repo hulu: <https://github.com/anomalyco/opencode> · dokumentasi: <https://opencode.ai/docs/cli>

## 1. Push ke GitHub

```sh
cd opencode-server
cp .env.example .env          # isi password nanti di hosting, JANGAN di-commit
git init
git remote add origin git@github.com:<user>/opencode-server.git
git add .
git commit -m "Add OpenCode server stack"
git push -u origin main
```

`.env` dan `data/` sudah masuk `.gitignore`.

## 2A. Deploy lewat Docker / panel hosting

Di panel hosting (pilih **Deploy from GitHub**, bukan shared hosting PHP):

1. Repository: repo di atas.
2. Build: **Dockerfile** di root (atau `docker compose up -d` di VPS).
3. Port: **4096** → container `4096`.
4. Volume persisten: `/data` (berisi DB sesi, config, cache).
5. Environment variables — salin dari `.env.example`, terutama (**wajib diisi, jangan pakai placeholder**):
   - `OPENCODE_SERVER_USERNAME=opencode`
   - `OPENCODE_SERVER_PASSWORD=<acak panjang>`
   - `OPENCODE_PASSWORD=<sama seperti di atas>` (dipakai CLI saat connect)
   - provider opsional: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, dll.
6. Aktifkan **HTTPS** untuk domain. Kalau panel tidak menyediakan reverse proxy, pakai Caddy seperti contoh di `vps/Caddyfile`.
7. Set `HOST_BIND=0.0.0.0` hanya kalau platform meneruskan traffic publik langsung ke container. Kalau reverse proxy jalan di host yang sama, biarkan `127.0.0.1`.
8. Kalau platform menyediakan variabel `PORT`, image akan otomatis memakainya; default tetap `4096`.

Jalankan manual untuk cek lokal:

```sh
cp .env.example .env   # lalu edit password
mkdir -p data
docker compose up -d --build
curl -u 'opencode:PASSWORD' http://127.0.0.1:4096/api/info
```

## 2B. Deploy tanpa Docker di hosting Node.js

Repo ini juga punya `package.json`, jadi panel bertipe **Node.js app / Deploy from GitHub** bisa langsung:

- Build command: `npm install`
- Start command: `npm start`
- Node.js: `>= 20`
- Port: **isi `PORT=3000` di panel** (atau port yang ditentukan platform). Kalau platform meng-inject `PORT` otomatis, nilai itu yang dipakai; fallback repo juga `3000`. Error `PORT undefined` saat build hampir selalu berarti env ini belum diisi.

`@opencode/cli` memasang binary native lewat postinstall; `.npmrc` di repo memastikan script tidak di-skip. Kalau platform memakai npm 12 yang memblokir script (mis. Node 26), tambahkan `--allow-scripts=@opencode/cli` pada build command, atau jalankan `node node_modules/@opencode/cli/postinstall.mjs` setelah install.

Env wajib tetap seperti §2A. **Node.js tidak membaca `.env` otomatis** — isi semua variable di panel hosting (file `.env` di repo hanya dipakai `docker compose`, bukan `npm start`). Untuk penyimpanan, arahkan `XDG_DATA_HOME` / `OPENCODE_DB` ke direktori persisten milik platform kalau ada — kalau tidak, sesi bisa hilang saat restart. `ripgrep` (`rg`) dipakai untuk pencarian file; image Docker sudah menyertakannya, runtime Node.js biasanya tidak.

## 2C. Deploy di VPS (tanpa Docker, lewat SSH)

```sh
# user khusus service
sudo useradd -r -m -s /bin/bash opencode

# instal binary resmi
sudo -H -u opencode bash -c 'curl -fsSL https://opencode.ai/v2/install | bash'

# kredensial (jangan simpan di repo)
sudo install -d -m 700 /etc/opencode
printf 'OPENCODE_SERVER_PASSWORD=%s\n' "$(openssl rand -hex 24)" \
  | sudo tee /etc/opencode/server.env
sudo chmod 600 /etc/opencode/server.env

# service + reverse proxy HTTPS
sudo cp vps/opencode.service /etc/systemd/system/opencode.service
sudo cp vps/Caddyfile /etc/caddy/Caddyfile      # edit domain dulu
sudo systemctl daemon-reload
sudo systemctl enable --now opencode caddy
```

`opencode.service` membind ke `127.0.0.1:4096`; Caddy yang menangani HTTPS publik.
Kalau diakses dari browser/UI di origin lain, tambahkan `--cors https://domain-anda` pada `ExecStart`
(bisa diulang untuk beberapa origin).

## 3. Verifikasi

```sh
curl -u 'opencode:PASSWORD' https://oc.example.com/api/info
# harus balas JSON: {"version":"2.x.x","pid":...,"urls":[...],...}
```

Tanpa kredensial harus balas `401 {"_tag":"UnauthorizedError",...}` — itu normal.

## 4. Hubungkan CLI ke server baru

```sh
export OPENCODE_PASSWORD='<password yang sama>'
opencode --server https://oc.example.com
opencode --server https://oc.example.com api get /api/info
```

Bisa juga dibungkus script:

```sh
#!/bin/sh
OPENCODE_PASSWORD='<password>' exec opencode --server https://oc.example.com "$@"
```

## Catatan keamanan

- Basic auth akan mengirim password dalam cleartext kalau HTTP → **wajib HTTPS** (Caddy/panel).
- Jangan commit `.env`, `data/`, atau API key ke GitHub.
- Pakai password acak panjang, beda dari server lama.
- Server lama di `78.154.103.36:14071` punya kredensial berbeda; ini server baru, jadi harus dibuat ulang.

## soal Wipabyte

Saya tidak menemukan situs/publik dokumentasi "Wipabyte" (domain `wipabyte.com/.net/.io/.id` tidak resolve,
pencarian web tidak menemukan provider dengan nama itu). Langkah di atas sengaja generik:
petakan ke panel yang kamu pakai — kalau Wipabyte menyediakan **Docker app / deploy from GitHub**, pakai §2A;
kalau berupa **VPS dengan SSH**, pakai §2B.

## Sumber

- <https://opencode.ai/docs/cli> — `--server`, `--standalone`, background service
- <https://opencode.ai/docs/troubleshooting> — service, CORS, `OPENCODE_PASSWORD`
- <https://github.com/anomalyco/opencode> — repo resmi + perintah instal
- <https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/cli/Dockerfile> — dependency image resmi
