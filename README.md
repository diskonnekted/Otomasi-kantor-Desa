# Otomasi Kantor Desa

Dokumentasi resmi untuk aplikasi dashboard pemantauan layanan dan utilitas Kantor Desa. Proyek ini berbasis PHP (API) dengan antarmuka HTML/CSS/JavaScript ringan, menggunakan SQLite untuk penyimpanan data. Fokus pada kesederhanaan, keterbacaan, dan kemudahan pemasangan di lingkungan lokal (mis. XAMPP).

## Ringkasan
- Dashboard layanan, utilitas, dan statistik operasional kantor desa.
- Grafik energi: KWh Bulanan (6 bulan) dan Realtime Energi per Jam.
- Streaming data realtime menggunakan Server‑Sent Events (SSE).
- Simulator data untuk pengujian tanpa perangkat fisik.
- API ingest/metrics untuk integrasi perangkat dan akumulasi data.

## Arsitektur
- UI: `index.html`, `css/styles.css`, `js/*` (vanilla JS tanpa framework).
- API: `api/*.php` (PHP, SQLite), melayani ingest, metrics, SSE, dan kontrol.
- Database: `data/iot.db` (SQLite). Direktori `data/` harus writable.

## Prasyarat
- PHP 8.0+ dengan ekstensi SQLite3.
- Web server (Apache/Nginx). XAMPP pada Windows direkomendasikan untuk pemasangan cepat.
- Hak tulis ke direktori `data/` untuk membuat/menulis database.

## Instalasi (XAMPP / Windows)
1. Kloning repo ke `htdocs`:
   - `D:\xampp\htdocs\newiot` (sesuai struktur saat ini).
2. Pastikan direktori `data/` ada dan writable:
   - Jika `iot.db` belum ada, API akan membuat/menginisialisasi tabel saat pertama dipanggil (berdasarkan implementasi `api/db.php`).
3. Jalankan Apache dari XAMPP.
4. Akses aplikasi melalui browser:
   - `http://localhost/newiot/`

## Konfigurasi
- File `js/config.js`:
  - Atur daftar ruangan (`rooms`) dan perangkat (`devices`).
  - Opsi simulasi: `APP_CONFIG.simulate` untuk menyalakan simulasi saat muat.
- File `js/app.js`:
  - Logika pembaruan UI, perhitungan statistik, pengisian grafik, dan penanganan kedatangan tamu.
- File `js/simulator.js`:
  - Generator data dummy (daya, suhu, okupansi, level air, debit air, status lampu jalan, `gridVoltage`).

## Fitur Utama
- Kartu layanan (“Ruang Pelayanan — Kehadiran Tamu”) dengan indikator status, waktu kedatangan terakhir, dan log kedatangan terbaru.
- Kartu utilitas (tandon air, lampu jalan) dan statistik listrik ringkas:
  - Total Daya, Rata-rata Suhu, Okupansi Aktif, serta “Jumlah Tamu Datang”.
- Grafik energi:
  - KWh Bulanan (6 bulan).
  - Realtime Energi per Jam dengan 4 bucket waktu (6 jam per bucket) dan pengisian data dummy saat simulasi aktif.
- Tampilan responsif dan konsisten dengan gaya kartu layanan.

## Menyalakan Simulasi
- Toggle “Simulasi” pada UI menyalakan generator data dummy.
- Grafik realtime diisi awal dengan data dummy (tegangan 220–235 V, daya 120–300 W) agar garis terlihat langsung.
- `pushAssets()` pada simulator menyertakan `gridVoltage` untuk konsistensi sumber data API.

## Referensi API
Semua endpoint berada di direktori `api/`.

- Ingest pembacaan sensor (`POST /api/ingest.php`):
  Contoh payload JSON:
  ```json
  {
    "room_key": "toilet",
    "readings": {
      "power": 180.5,
      "temp": 26.7,
      "occupancy": 1
    },
    "assets": {
      "waterLevel": 65.2,
      "waterFlow": 12.4,
      "streetLightStatus": 1,
      "gridVoltage": 228.9
    },
    "device_status": {
      "street_main": 1
    }
  }
  ```
  - Menyimpan metrik per ruang (`metrics`), aset (`assets`), dan status perangkat (`devices`).

- Agregasi metrik (`GET /api/metrics.php`):
  - Mengembalikan ringkasan/akumulasi untuk ditampilkan di dashboard.

- Server‑Sent Events (`GET /api/sse.php`):
  - Menyediakan aliran data realtime ke UI (tanpa polling manual).

- Kontrol perangkat (`POST /api/control.php`):
  - Antarmuka untuk mengubah status perangkat tertentu (skema bergantung implementasi).

## Struktur Direktori
- `api/` — endpoint PHP: ingest, metrics, SSE, kontrol.
- `css/` — gaya global UI.
- `img/` — aset gambar (logo).
- `js/` — logika UI, konfigurasi, simulator, SSE client.
- `index.php` — entrypoint PHP jika diperlukan (server‑side rendering ringan).
- `index.html` — halaman utama dashboard.
- `data/` — database SQLite (`iot.db`).

## Panduan Pengembangan
- Gaya kartu dan tipografi: `css/styles.css`.
- Komponen UI yang sering dipakai:
  - `mini-card` untuk kartu ringkas (statistik kecil).
  - `service-header` untuk header kartu seragam.
  - `chart-card` untuk wadah grafik; `canvas` memiliki rasio aspek proporsional terhadap lebar.
- Grafik menggunakan `canvas` bawaan dan logika pengisian data di `js/app.js`.

## Praktik Baik
- Jangan commit file database lokal: sudah dikecualikan oleh `.gitignore` (`data/*.db`).
- Gunakan API ingest untuk data produksi; simpanan dummy hanya untuk pengujian.
- Pastikan direktori `data/` writable agar API dapat menulis database.

## Catatan Ikon
Dokumen ini tidak menggunakan ikon berwarna. Jika diperlukan, gunakan simbol monokrom (mis. "•", "—", "→") untuk menjaga konsistensi dan aksesibilitas.

---
Dikembangkan untuk kebutuhan transparansi dan pemantauan kantor desa. Kontribusi dan perbaikan selalu diterima melalui pull request.
