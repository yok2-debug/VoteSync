# VoteSync - Sistem E-Voting Modern

VoteSync adalah aplikasi E-Voting (pemungutan suara elektronik) full-stack yang dibangun untuk menyediakan platform yang aman, real-time, dan mudah digunakan untuk mengelola pemilihan. Aplikasi ini dibuat menggunakan Next.js, Firebase Realtime Database, dan Tailwind CSS.

Arsitekturnya dirancang dengan pemisahan yang jelas antara antarmuka pengguna (frontend), logika server (API Routes), dan database, membuatnya kuat, aman, dan siap untuk diskalakan.

---

## ✨ Fitur Utama

Aplikasi ini dibagi menjadi tiga portal utama dengan fungsionalitas yang kaya.

### Portal Publik
- **Daftar Pemilihan Aktif:** Melihat semua pemilihan yang sedang berlangsung atau akan datang.
- **Detail Kandidat:** Mengakses informasi kandidat, termasuk visi dan misi mereka.
- **Real Count Langsung:** Memantau perolehan suara secara real-time melalui dasbor publik dengan grafik visual.
- **Halaman Login:** Pintu masuk yang terpisah untuk Pemilih dan Administrator.

### Portal Pemilih (Area Aman)
- **Dasbor Personal:** Setelah login, pemilih hanya akan melihat pemilihan yang berhak mereka ikuti.
- **Antarmuka Voting:** Halaman voting yang aman dan intuitif untuk setiap pemilihan.
- **Mekanisme Satu Suara:** Sistem memastikan setiap pemilih hanya dapat memberikan satu suara per pemilihan.

### Portal Admin (Kontrol Penuh dengan RBAC)
- **Manajemen Pemilihan:** Membuat, mengedit, dan mengelola pemilihan, termasuk mengatur jadwal dan panitia.
- **Manajemen Kandidat:** Mengelola kandidat untuk setiap pemilihan, lengkap dengan nomor urut, foto, dan visi-misi. Termasuk fitur *drag-and-drop* untuk mengubah nomor urut.
- **Manajemen Pemilih:**
  - CRUD (Create, Read, Update, Delete) untuk data pemilih.
  - **Impor & Update Massal:** Mengimpor pemilih dari file CSV dan mengubah kategori banyak pemilih sekaligus.
  - **Cetak Kartu Pemilih:** Menghasilkan kartu login fisik yang berisi ID dan password untuk pemilih.
- **Manajemen Pengguna & Peran (RBAC):**
  - Membuat peran kustom (misal: "Operator", "Panitia").
  - Menetapkan izin akses spesifik untuk setiap peran.
  - Mengelola pengguna admin dan menetapkan peran mereka.
- **Laporan Rekapitulasi:** Menghasilkan dokumen "Berita Acara" hasil pemilihan yang siap cetak dan resmi.
- **Pengaturan Sistem:** Mengonfigurasi tampilan Real Count dan melakukan reset data (suara, pemilih, dll.) dengan aman.

---

## 🚀 Instalasi dan Menjalankan Secara Lokal

Ikuti langkah-langkah ini untuk menjalankan proyek di komputer lokal Anda.

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 atau lebih tinggi)
- `npm` atau `yarn`

### 2. Kloning Repositori
```bash
git clone https://github.com/URL_ANDA/nama-repo.git
cd nama-repo
```

### 3. Instal Dependensi
Jalankan perintah berikut untuk menginstal semua paket yang dibutuhkan oleh proyek:
```bash
npm install
```

### 4. Konfigurasi Environment Variable
Aplikasi ini membutuhkan koneksi ke proyek Firebase.

1.  Salin file `.env.example` menjadi file baru bernama `.env.local`:
    ```bash
    cp .env.example .env.local
    ```
2.  Buka file `.env.local` dan isi semua variabel dengan nilai dari proyek Firebase Anda. Anda bisa mendapatkan nilai-nilai ini dari konsol Firebase Anda (**Project Settings > General > Your apps > Web app**).

    ```env
    # Firebase Admin SDK (Server-side) - Dapatkan dari Service Account JSON
    FIREBASE_PROJECT_ID="nama-project-anda"
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@nama-project-anda.iam.gserviceaccount.com"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

    # Firebase Client SDK (Public) - Dapatkan dari Firebase Console
    NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="nama-project-anda.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://nama-project-anda-default-rtdb.firebaseio.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="nama-project-anda"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="nama-project-anda.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
    NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"
    ```
    **Penting:** Variabel `FIREBASE_PRIVATE_KEY` harus dalam format satu baris dengan karakter `\n` untuk baris baru.

### 5. Jalankan Server Pengembangan
Setelah konfigurasi selesai, jalankan server pengembangan Next.js:
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat aplikasi berjalan.

- **Login Admin Default:**
  - Username: `admin`
  - Password: `admin`
