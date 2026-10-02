# Ekspansi Katalog Gudang Menjadi 3.000 Item Suku Cadang & Virtual Scrolling Engine

Rencana peningkatan kapasitas katalog WMS offline untuk menangani 3.000 item suku cadang dan consumable dengan performa 60 FPS menggunakan engine virtual scrolling tak terbatas, pencarian instan, dan distribusi merata ke struktur denah rak 3 angka awal.

## User Review & Critical Decisions

> [!IMPORTANT] Ringkasan Keputusan yang Dikonfirmasi oleh Pengguna:
> - **Sumber & Variasi Data**: Mengembangkan dataset dari variasi model unit dan ukuran suku cadang yang ada (baut, bearing, seal, filter, bushing, kampas rem, v-belt, hose, komponen Scania, Hino, Komatsu, XCMG, Triton, Toyota, dll.) hingga mencapai tepat 3.000 SKU realistis dengan spesifikasi teknis dan part number standar industri.
> - **Distribusi Denah Rak**: Menyebarkan 3.000 item secara proporsional dan terstruktur ke dalam kelompok rak 3 angka awal (Rak 101 s/d 114, Rak 201) serta kontainer penyimpanan (Kontainer GET, Kontainer Tyre, Kontainer B3, Kontainer WHS, Area Radiator, dll.).
> - **Arsitektur Tampilan**: Menggunakan **Virtual Scrolling / Infinite List** dengan windowing virtualisasi rendering, sehingga browser hanya merender elemen yang tampak di viewport (sekitar 25-30 baris DOM) meskipun katalog memuat 3.000+ item, menjaga memori tetap ringan dan pencarian tetap instan di bawah 5ms.

---

### 1. Overview & Core Concept

- **Apa yang Dibangun**:
  Aplikasi WMS offline akan ditingkatkan kapasitas basis datanya untuk mengelola 3.000 SKU suku cadang riil. Dilengkapi generator dataset deterministik yang memperluas seluruh kategori alat berat dan armada secara logis, serta engine tabel virtualisasi (*windowing viewport*) yang menjamin kelancaran navigasi 3.000 item tanpa lag.
- **Target Pengguna**:
  Tim Logistik, Kepala Gudang, Planner Maintenance, dan Mekanik Tambang yang membutuhkan pencarian cepat suku cadang dan pemantauan stok fisik dalam volume ribuan part.
- **Nilai Tambah**:
  Skalabilitas penuh pengelolaan gudang skala besar tanpa penurunan performa browser, tetap beroperasi 100% offline dengan pencatatan mutasi transaksi dan audit stock opname yang akurat.

---

### 2. User Experience & Visual Design

- **Alur Pengguna (User Flows)**:
  1. Pengguna membuka tab **Katalog Stok**, langsung melihat 3.000 SKU termuat secara instan.
  2. Pengguna mengetik kata kunci pada pencarian (misal: "Filter", "Bearing", "Scania", "101A") — hasil 3.000 item tersaring seketika dengan penyorotan teks (*highlight*).
  3. Menggulir (*scrolling*) daftar 3.000 item dengan sangat mulus menggunakan virtual list (hanya merender item di layar, kalkulasi posisi absolut otomatis).
  4. Pengguna dapat beralih antara mode **Virtual Scrolling Tak Terbatas** dan mode **Paginasi Klasik** jika diperlukan saat mencetak laporan.
  5. Pada tab **Peta Rak**, masing-masing grup rak 3 angka (Rak 101 - 114, Kontainer) menampilkan distribusi bin yang padat dan informatif.

- **Identitas Visual & Desain**:
  - *Tema & Mood*: Industrial Slate & Safety Amber khas logistik alat berat dan pertambangan modern.
  - *Hierarki Tipografi*: Angka metrik menggunakan `tabular-nums font-mono` agar digit sejajar sempurna; label dan deskripsi part menggunakan `font-sans` kontras tinggi.
  - *Zero-Pill Discipline*: Metadata rak, tipe, dan part number disajikan dalam teks monospaced bersih dengan pembatas tipografis yang rapi.
  - *Indikator Status*: Warna semantik fungsional (Emerald untuk stok aman, Amber untuk order/kritis, Crimson untuk stok habis) dipadukan dengan label status teks eksplisit.

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Strategi Dataset 3.000 Item**
  - *Pendekatan*: Menghasilkan dataset terstruktur 3.000 SKU berbasis data part asli yang dikombinasikan dengan variasi dimensi standar (M6-M36 untuk fastener, filter berbagai tipe kompresor/mesin, bearing serie 6000-6300, 32000, kampas rem, V-belt seri A/B/C, hose hydraulic, dan GET teeth).
  - *Alasan*: Menjaga data tetap kontekstual dengan operasional tambang/armada nyata pengguna, memiliki nomor part yang valid, harga realistis, dan lokasi rak yang konsisten.
  - *Alternatif*: Data acak lorel ipsum (ditolak karena tidak bermakna bagi operasional gudang).

- **Keputusan 2: Engine Virtual Scrolling Kustom Tanpa Ketergantungan Eksternal**
  - *Pendekatan*: Mengimplementasikan lightweight virtual windowing hook berbasis `scrollTop` dan `containerHeight` dengan overscan buffer 5 baris atas/bawah.
  - *Alasan*: Tidak membutuhkan library pihak ketiga yang besar, kompatibel 100% dengan React 19, waktu render nol latency, dan tahan terhadap manipulasi DOM.
  - *Alternatif*: Render 3.000 node DOM langsung (akan menyebabkan browser lambat dan stuttering saat scrolling).

- **Keputusan 3: Kompresi dan Optimasi LocalStorage**
  - *Pendekatan*: Menyimpan data katalog inti dalam format JSON terkompresi di `IndexedDB` / `localStorage` dengan caching in-memory di React state.
  - *Alasan*: Menghindari limit 5MB LocalStorage browser pada beberapa perangkat dan menjamin operasi offline mulus.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          WMS Offline Client                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────┐                         ┌───────────────────────┐
│  Dataset Engine       │                         │ Storage Service       │
│  (3.000 Seed Items)   │                         │ (LocalStorage / Cache)│
│  - Real mining parts  │                         │ - Fast Indexing       │
│  - Even Rack Mapping  │                         │ - Backup & Restore    │
└──────────┬────────────┘                         └──────────┬────────────┘
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        UI Viewports & Windows                          │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ Virtual Scroll Table │  │ Hierarchical    │  │ Reorder / PO      │  │
│  │ - 3.000 SKU Window   │  │ Rack Map (3 Dig)│  │ & Audit Opname    │  │
│  │ - Dynamic Search 5ms │  │ - Sub-Bins Grid │  │ - Critical Alerts │  │
│  └──────────────────────┘  └─────────────────┘  └───────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Komponen yang Akan Dibuat / Diperbarui:
1. `src/data/seedGenerator.ts`: Generator deterministik cerdas yang menghasilkan 3.000 SKU unik dengan variasi ukuran baut, nomor part resmi, filter, pelumas, bearing, komponen unit, dan rak teralokasi.
2. `src/hooks/useVirtualScroll.ts`: Hook virtualisasi rendering untuk menangani ribuan baris dengan konsumsi CPU dan memori minimal.
3. `src/components/InventoryView.tsx`: Integrasi virtual scrolling dengan toggle ukuran baris, search counter, dan filter instan.
4. `src/services/storage.ts`: Optimasi penyimpanan untuk menangani 3.000 item, transaksi mutasi, dan stock opname secara persisten.
