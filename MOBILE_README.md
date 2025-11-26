# Persyaratan Build Aplikasi Mobile (React Native) di Linux

Dokumen ini merangkum semua perangkat lunak dan konfigurasi yang diperlukan untuk membangun aplikasi mobile cross-platform menggunakan React Native dari lingkungan Linux.

## 1. Persyaratan Umum

Perangkat lunak ini dibutuhkan untuk pengembangan umum React Native.

- **Node.js**: Versi LTS (Long-Term Support) direkomendasikan.
- **npm** atau **yarn**: Manajer paket untuk JavaScript.
- **Watchman**: Sebuah tool dari Facebook untuk memantau perubahan file.
- **React Native CLI**: Tool baris perintah untuk React Native.

```bash
# Instal React Native CLI
npm install -g react-native-cli
```

---

## 2. Membangun untuk Android (Bisa Dilakukan di Linux)

Anda dapat mengembangkan dan membangun aplikasi Android sepenuhnya di Linux.

### Perangkat Lunak yang Dibutuhkan:

1.  **Java Development Kit (JDK)**:
    - React Native membutuhkan versi JDK tertentu. Umumnya **OpenJDK 17**.
    - Anda bisa menginstalnya melalui manajer paket distro Anda (misal: `sudo apt install openjdk-17-jdk`).

2.  **Android Studio**:
    - Ini adalah cara termudah untuk menginstal dan mengelola Android SDK.
    - Unduh dari situs resmi Android Developer.
    - Setelah instalasi, buka Android Studio dan instal komponen berikut melalui SDK Manager:
        - Android SDK Platform
        - Intel x86 Atom_64 System Image atau Google APIs Intel x86 Atom System Image (untuk emulator).

3.  **Android SDK**:
    - Android Studio akan menginstalnya secara otomatis. Pastikan Anda tahu lokasinya (biasanya `~/Android/Sdk`).

### Konfigurasi Environment:

Tambahkan baris berikut ke file `~/.bashrc` atau `~/.zshrc` Anda.

```bash
# Ganti /home/USERNAME/ dengan path home direktori Anda
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Jangan lupa jalankan `source ~/.bashrc` (atau `source ~/.zshrc`) untuk menerapkan perubahan.

### Perintah Build Produksi:

Untuk membuat file `.aab` yang siap diunggah ke Google Play Store:
```bash
# Dari root direktori proyek React Native Anda
cd android
./gradlew bundleRelease
```

---

## 3. Membangun untuk iOS (TIDAK Bisa Dilakukan di Linux)

**Penting:** Anda tidak dapat membuat versi produksi (file `.ipa`) dari aplikasi iOS di sistem operasi Linux.

### Alasan:

- Proses build iOS memerlukan **Xcode**, yaitu perangkat lunak pengembangan resmi dari Apple.
- Xcode **hanya tersedia untuk macOS**.

### Solusi:

1.  **Gunakan Komputer Mac**: Cara paling langsung adalah dengan memiliki akses ke komputer Mac untuk melakukan kompilasi akhir.
2.  **Cloud CI/CD (Continuous Integration/Continuous Deployment)**: Ini adalah solusi modern dan profesional.
    - **Contoh Layanan**: GitHub Actions, GitLab CI, Bitrise, Codemagic.
    - **Cara Kerja**: Anda mengonfigurasi layanan ini untuk secara otomatis menjalankan proses build di mesin virtual macOS di cloud setiap kali Anda `push` kode baru ke repository Git Anda. Layanan ini akan menghasilkan file `.ipa` yang bisa Anda unduh dan unggah ke Apple App Store.
3.  **Virtual Machine (Tidak Direkomendasikan)**: Menjalankan macOS di dalam VirtualBox atau VMWare. Metode ini seringkali lambat, tidak stabil, dan mungkin melanggar perjanjian lisensi perangkat lunak Apple.

