---
name: Pangkas Repo
description: Pangkas repo git di /root/projects jadi clone hemat storage (sparse, blobless, shallow) tanpa kehilangan path yang dipakai command. Pakai saat user minta mengecilkan ukuran repo / hemat storage HP, atau saat repo besar membengkak tapi sebagian file saja yang dipakai.
---

# Pangkas Repo

Workflow wajib, aman, dan urut (4 pilar berpikir komputasional). Jangan pernah hapus repo lama sebelum verifikasi lolos.

## 1. Inventaris & ukurkan dulu (Decomposition)
- Ukur semua proyek: `du -sh /root/projects/*/`.
- Deteksi repo git: `git -C <dir> remote get-url origin` (simpan URL-nya).
- Catat ukuran **sebelum** tiap repo — dipakai di laporan akhir.

## 2. Cari pola pemakaian (Pattern Recognition)
- Kumpulkan path yang dirujuk command:
  `grep -rhoE "/root/projects/[A-Za-z0-9_./-]+" /root/projects/.opencode/commands/ /root/.oc-opencode2/config/opencode/commands/`
- `-r` rekursif, `-h` tanpa nama file, `-o` cuma bagian yang cocok. Buang duplikat (`sort -u`).
- **Hanya path yang dirujuk yang wajib disimpan.** Path tanpa referensi boleh dibuang.

## 3. Tetapkan pola clone hemat (Abstraction)
- Clone per repo ke dir sementara:
  `git clone --depth 1 --filter=blob:none --sparse <url> <dir-baru>`
- Isi sparse-checkout dengan daftar path hasil grep:
  `git -C <dir-baru> sparse-checkout set --no-cone <daftar-path>`
- `--depth 1` = riwayat terakhir saja; `--filter=blob:none` = blob diunduh saat checkout; `--sparse` = cuma path terpilih.

## 4. Algoritma aman (wajib — jangan dilanggar)
- Verifikasi **SEMUA** path yang dibutuhkan di clone baru, satu per satu:
  `for p in <daftar-path>; do [ -e "<dir-baru>/${p%/}" ] || echo "MISSING: $p"; done`
- Kalau clone gagal **atau** ada path hilang → **repo lama DIPERTAHANKAN**, clone baru dibuang (`rm -rf <dir-baru>`).
- Hanya ganti kalau verifikasi lolos: `rm -rf <dir-lama> && mv <dir-baru> <dir-lama>`.
- Ukur ulang: `du -sh <dir-lama>` → catat ukuran **sesudah**.

## 5. Gagal jaringan (`fatal: early EOF`)
- Siapkan env sebelum clone:
  `export GIT_HTTP_LOW_SPEED_LIMIT=1000 GIT_HTTP_LOW_SPEED_TIME=120 GIT_NO_LAZY_FETCH=1`
  `git config --global http.postBuffer 524288000`
- `GIT_NO_LAZY_FETCH=1` = cegah git diam-diam fetch blob saat inspeksi (boros & lelet).
- Retry **maksimal 3x** per repo, jeda `sleep 5` di antara attempt; hapus clone gagal sebelum attempt berikutnya.
- Repo besar (>500M): pakai `--depth 1` dulu, baru tambahkan `--filter=blob:none --sparse` kalau masih gagal.
- Habis 3x tetap gagal → tandai `GAGAL-dipertahankan`, jangan sentuh repo lama.

## 5b. Jebakan blobless (wajib tahu)
- `--filter=blob:none` **saja TIDAK cukup** — kalau full worktree di-checkout, blob tetap keunduh. **Harus digabung `--sparse`** (langkah 3 sudah benar).
- Jangan `git show / git log -p / git diff / git blame` di repo blobless — tiap perintah itu fetch blob satu-satu = lambat & boros kuota. Baca file biasa saja (`cat`/read), atau pakai GitHub web kalau butuh riwayat.
- Alternatif pola sparse non-cone untuk buang folder berat sekaligus: `git sparse-checkout set --no-cone "/*" "!/path-berat"` (mis. buang `fixtures/`, `testdata/`).

## 6. Format jawaban akhir (wajib)
- Tabel:

  | Repo | Sebelum | Sesudah | Status |
  |---|---|---|---|
  | `<nama>` | `<du>` | `<du>` | `OK` / `GAGAL-dipertahankan` |

- Total penghematan: `sebelum → sesudah` (selisihnya).
- Catatan per repo: daftar path yang disimpan, dan alasan kalau status `GAGAL-dipertahankan`.
- Jawab singkat, Bahasa Indonesia, sertakan perintah yang dipakai bila diminta. Jangan mengarang angka — pakai hasil `du` asli.
