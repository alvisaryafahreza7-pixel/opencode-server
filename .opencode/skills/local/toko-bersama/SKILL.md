---
name: Toko Bersama
description: Jalankan simulasi toko yang dikelola tim subagent OpenCode berperan kasir + stocker. Pakai saat user minta main/lanjut/reset "toko bareng agent", /toko, atau simulasi bisnis multiagent.
---

# Toko Bersama

Mini simulasi toko di `/root/projects/games/toko-multiagent/`. Baca `PANDUAN.md` dulu kalau perlu detail.

## Workflow (satu hari = satu putaran)
1. **Status**: `cd /root/projects/games/toko-multiagent && python3 sim.py status`. Kalau `init`/`reset` → `python3 sim.py init`.
2. **Spawn 2 subagent paralel** (satu agent = satu tugas, sesuai aturan project):
   - Kasir: prompt = isi `roles/kasir.md` + state hari ini → minta JSON `{prices, marketing, alasan}`.
   - Stocker: prompt = isi `roles/stocker.md` + state hari ini → minta JSON `{restock, alasan}`.
   - Kalau sudah punya `sessionID` kedua subagent, **kirim follow-up ke sesi yang sama** (pakai parameter `sessionID`) biar konteks peran terjaga.
3. **Gabungkan** kedua JSON jadi satu: `{"restock":..., "prices":..., "marketing":...}` (buang field `alasan`).
4. **Eksekusi**: `python3 sim.py apply '<json-gabungan>'`.
5. **Lapor** singkat Bahasa Indonesia: keputusan kasir + stocker, pendapatan, barang terjual, kas akhir, reputasi, stok yang menipis. Pakai tabel kalau perlu.

## Aturan
- Subagent wajib keluarkan **JSON murni** (tanpa markdown fence). Kalau ada teks tambahan, ekstrak JSON-nya atau minta ulang 1x.
- Jangan spawn lebih dari 2 subagent per hari (RAM HP terbatas).
- Model: ikut config `agents.general` (gratis) — jangan set model manual kecuali diminta.
- Jangan edit `sim.py` saat main; perbaikan mesin hanya kalau user minta.
- Bangkrut (kas < 0) → hentikan, laporkan hasil, tawarkan `reset`.
- Target kemenangan: kas 1000 atau reputasi 100.
