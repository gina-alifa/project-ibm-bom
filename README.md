# KosKu Docs

Aplikasi manajemen kos berbasis web dengan fitur **Document to Database** – mengkonversi teks dokumen sewa menjadi data penghuni dan pembayaran secara otomatis.

## Stack Teknologi

- **HTML5** + **CSS3** + **Vanilla JavaScript** (ES6+)
- Tidak ada framework, tidak ada library eksternal
- Data disimpan di **localStorage** browser

## Cara Menjalankan

1. **Unduh / clone** semua file ke satu folder:
   ```
   index.html
   style.css
   app.js
   README.md
   ```

2. **Buka `index.html`** langsung di browser modern (Chrome, Firefox, Edge, Safari):
   - Klik dua kali file `index.html`, **atau**
   - Seret file ke tab browser, **atau**
   - Gunakan ekstensi Live Server di VS Code untuk hot-reload

3. **Tidak perlu server** — aplikasi berjalan 100% di sisi klien.

> ⚠️ Data tersimpan di `localStorage` browser yang sama. Jika buka di browser / tab berbeda, data tidak akan muncul.

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Dashboard** | 4 KPI card: total kamar, terisi, kosong, pendapatan bulan ini |
| **Kamar** | Tabel 10 kamar dengan tipe, harga, status, dan penghuni |
| **Penghuni** | CRUD penghuni – nama, HP, kamar, tanggal masuk, harga sewa |
| **Pembayaran** | Tracker per penghuni per bulan; otomatis "Terlambat" lewat tgl 5 |
| **Document to Database** | Tempel teks kontrak → ekstrak via regex → pratinjau & simpan |

## Document to Database – Format Input

Format fleksibel, pisahkan dengan `,`, `|`, atau newline:

```
Nama: Budi Santoso, Kamar: A3, Masuk: 01-11-2026, Sewa: Rp 850.000/bulan
Nama: Siti Rahayu | Kamar: B2 | HP: 081234567890 | Masuk: 15/10/2026 | Sewa: 750000
```

Field yang didukung: `Nama`, `No. HP`, `Kamar`, `Masuk` (tanggal), `Sewa` (harga).

## Data Dummy Bawaan

- **10 kamar**: A1–A3 (Standar), B1–B3 (Deluxe), C1–C3 (VIP), D1 (Eksklusif)
- **6 penghuni** aktif
- **3 bulan** riwayat pembayaran (Agustus–Oktober 2026) dengan berbagai status

## Reset Data

Buka DevTools → Application → Local Storage → hapus semua key `kosku_*`, lalu refresh.

---

*KosKu Docs v1.0.0 – Dibuat dengan HTML5 + CSS3 + Vanilla JS*
