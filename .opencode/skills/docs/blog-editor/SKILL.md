---
name: Blog Editor
description: Edit dan publish post Blogger langsung dari sesi ini — perbaikan aman tanpa mengubah cerita asli. Pakai saat user minta sunting,proofread, tambah jembatan antar bab, atau publish blog.
---

# Blog Editor

Skill ini **dipasangkan dengan command `/blog`**: command adalah pintu masuk singkat, skill ini adalah satu-satunya sumber aturan. Kalau ada permintaan sunting blog, baca skill ini dulu — jangan pakai ingatan.

## Helper

`scripts/blogedit.py` (relatif terhadap direktori skill ini) melakukan fetch → apply → publish → verify dalam satu panggilan, otomatis refresh token, dan menolak perubahan berisiko.

```sh
python3 scripts/blogedit.py status
python3 scripts/blogedit.py fetch
python3 scripts/blogedit.py apply /tmp/opencode/blog-edits.json --dry
python3 scripts/blogedit.py apply /tmp/opencode/blog-edits.json
python3 scripts/blogedit.py push
```

Jangan pakai API key — Blogger API menolak API key untuk tulis. Jangan pernah tampilkan isi `token.json` / `credentials.json` di chat.

## Target default

- Blog ID: `7100036323484833731`
- Post ID: `5568284433876837160`
- Judul: DI BALIK PANTULAN
- URL: https://alvisaryafahreza.blogspot.com/2026/11/di-balik-pantulan.html

Kalau user menyebut post lain, ubah konstanta `BLOG_ID` / `POST_ID` di `scripts/blogedit.py` lebih dulu.

## Alur wajib

1. `python3 scripts/blogedit.py status`. Kalau `Auth` bukan `OK`, jalankan `python3 /root/projects/gblog-skill/scripts/gblog.py auth`, berikan link OAuth ke user, tunggu callback selesai.
2. Tulis `/tmp/opencode/blog-edits.json`: array `{"old": "teks asli persis", "new": "teks perbaikan"}`. Tambahkan `"all": true` hanya jika memang mau mengganti semua kemunculan.
3. Preview dengan `--dry`, tampilkan ringkasan `old → new` ke user.
4. Publish tanpa `--dry`. Helper otomatisverifikasi (teks masuk, gambar tidak berubah).
5. Lapor singkat: jumlah titik diperbaiki, URL, dan yang sengaja tidak diubah.

Untuk perubahan besar yang bukan sekadar replace: `fetch` → sunting `/tmp/opencode/blog-work.html` → `push`.

## Aturan isi

Perbaiki **hanya** yang objektif salah:

- typo / ejaan
- nama tokoh keliru (`Ren` → `Ran`)
- pengulangan kata yang jelas berlebihan
- grammar rusak / tanda baca hilang
- jembatan antaradegan memakai "Tapi" / "Namun" jika sambungan terasa loncat

**Dilarang:** menulis ulang kalimat, mengubah alur, dialog, sudut pandang, gaya bahasa, menghapus adegan, merapikan bisikan yang sengaja terpotong (`Ak- gak... Memb- tahu...`), mengubah tag HTML / atribut gambar / CSS. Kalau ragu — jangan ubah.

## Error umum

- `403 access_denied` → Google Auth Platform → **Audience** → **Test users** → tambahkan email user → SAVE. Status aplikasi tetap *Testing*.
- `redirect_uri_mismatch` / belum auth → jalankan ulang `gblog auth` dengan kredensial **Desktop app**.
- Jangan menjawab "silakan copy-paste" — user tidak mau itu.

## Contoh laporan

```
✓ 4 titik diperbaiki, 2 gambar utuh
https://alvisaryafahreza.blogspot.com/2026/11/di-balik-pantulan.html
Sengaja tidak diubah: bisikan terpotong & cliffhanger akhir.
```
