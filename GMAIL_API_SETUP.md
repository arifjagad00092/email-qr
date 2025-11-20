# Gmail API Setup Guide

Panduan lengkap untuk setup Gmail API untuk mengambil kode verifikasi secara otomatis.

## Langkah 1: Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "Select a project" di bagian atas
3. Klik "NEW PROJECT"
4. Masukkan nama project (contoh: "Luma Registration Automation")
5. Klik "CREATE"

## Langkah 2: Enable Gmail API

1. Di Google Cloud Console, buka menu (≡) dan pilih **APIs & Services** > **Library**
2. Cari "Gmail API"
3. Klik pada "Gmail API"
4. Klik tombol **ENABLE**

## Langkah 3: Buat OAuth 2.0 Credentials

1. Buka menu (≡) dan pilih **APIs & Services** > **Credentials**
2. Klik **CREATE CREDENTIALS** > **OAuth client ID**
3. Jika diminta, configure OAuth consent screen terlebih dahulu:
   - User Type: **External**
   - Klik **CREATE**
   - Isi informasi aplikasi:
     - App name: "Luma Registration Automation"
     - User support email: email Anda
     - Developer contact: email Anda
   - Klik **SAVE AND CONTINUE**
   - Scopes: Skip (klik **SAVE AND CONTINUE**)
   - Test users: Klik **ADD USERS** dan tambahkan email Gmail yang akan digunakan
   - Klik **SAVE AND CONTINUE**
   - Klik **BACK TO DASHBOARD**

4. Kembali ke **Credentials** > **CREATE CREDENTIALS** > **OAuth client ID**
5. Application type: **Web application**
6. Name: "Luma Registration Client"
7. Authorized redirect URIs: Klik **ADD URI** dan masukkan:
   ```
   http://localhost:5173/oauth/callback
   ```
8. Klik **CREATE**
9. Copy **Client ID** dan **Client Secret** yang muncul

## Langkah 4: Dapatkan Refresh Token

### Menggunakan Aplikasi

1. Jalankan aplikasi ini
2. Paste **Client ID** dan **Client Secret** yang sudah dicopy
3. Klik "Generate Authorization URL"
4. Browser akan membuka halaman Google OAuth
5. Pilih akun Gmail yang akan digunakan
6. Klik "Continue" untuk memberikan akses ke Gmail
7. Setelah authorize, browser akan redirect ke URL dengan parameter `code`
8. Copy nilai `code` dari URL (contoh: `http://localhost:5173/oauth/callback?code=4/0AVG7fiQ...`)
9. Paste code tersebut ke aplikasi
10. Klik "Exchange for Refresh Token"
11. **Refresh Token** akan muncul - simpan dengan aman!
12. Klik "Complete Setup"

### Alternatif: Manual dengan cURL

Jika cara di atas tidak berhasil, Anda bisa mendapatkan refresh token secara manual:

1. Buat Authorization URL (ganti `YOUR_CLIENT_ID`):
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5173/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent
```

2. Buka URL di browser dan authorize
3. Copy authorization code dari redirect URL
4. Exchange code untuk refresh token dengan cURL (ganti `YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET`, dan `YOUR_AUTH_CODE`):

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=YOUR_AUTH_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:5173/oauth/callback" \
  -d "grant_type=authorization_code"
```

5. Response akan berisi `refresh_token` - simpan nilai ini!

## Langkah 5: Siapkan File Email List

Buat file JSON dengan format berikut (contoh: `emails.json`):

```json
[
  {
    "email": "user1@gmail.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  {
    "email": "user2@gmail.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }
]
```

## Cara Menggunakan Sistem

1. Setelah setup Gmail API selesai, aplikasi akan menampilkan dashboard
2. Masukkan **Event API ID** dari Luma (default: `evt-nTA5QQPkL5SrU9g`)
3. Upload file `emails.json`
4. Klik "Start Registration Process"
5. Sistem akan otomatis:
   - Register setiap email ke event Luma
   - Request kode verifikasi ke email
   - Ambil kode dari Gmail menggunakan API
   - Sign in dengan kode verifikasi
   - Simpan hasil ke database

## Cara Kerja Sistem

### Flow Otomatis:

```
1. Register ke Luma Event
   ↓
2. Kirim request kode verifikasi
   ↓
3. Gmail API cek inbox setiap 5 detik (max 10 attempts)
   ↓
4. Extract kode 6 digit dari email
   ↓
5. Sign in dengan kode
   ↓
6. Simpan hasil ke database Supabase
```

### Format Email yang Dicari:

- **From:** noreply@luma.co
- **Subject:** verification
- **Age:** Kurang dari 5 menit
- **Code:** 6 digit angka

## Troubleshooting

### Error: "Failed to refresh access token"
- Pastikan Client ID dan Client Secret benar
- Pastikan Refresh Token masih valid
- Coba generate refresh token baru

### Error: "Verification code not found"
- Pastikan email dari Luma sudah masuk ke inbox
- Check spam folder
- Pastikan email address yang digunakan sama dengan yang di-authorize di Google Cloud Console
- Increase max attempts atau delay di `gmailService.ts`

### Error: "Access blocked: This app's request is invalid"
- Pastikan redirect URI di Google Cloud Console sama persis dengan yang di aplikasi
- Pastikan Gmail API sudah di-enable
- Pastikan test user sudah ditambahkan di OAuth consent screen

## Security Notes

- **JANGAN** share Client Secret atau Refresh Token dengan siapapun
- **JANGAN** commit credentials ke Git
- Gunakan environment variables untuk production
- Refresh Token memberikan akses unlimited ke Gmail - simpan dengan aman!
- Gunakan akun Gmail khusus untuk automation (bukan akun personal)

## Tips

1. Buat Gmail account baru khusus untuk automation
2. Test dengan 1-2 email dulu sebelum batch besar
3. Monitor rate limits dari Luma API
4. Backup database Supabase secara berkala
5. Check registration history di dashboard untuk tracking

## Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) - Untuk testing OAuth flow
