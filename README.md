# SIPENUH-BOT

WhatsApp Bot untuk Sistem Informasi Pendaftaran Umrah (SIPENUH). Bot ini memfasilitasi proses pendaftaran umrah melalui WhatsApp dengan fitur interaktif dan otomatis.

## 📋 Deskripsi

SIPENUH-BOT adalah chatbot WhatsApp yang terintegrasi dengan sistem backend SIPENUH untuk memudahkan calon jamaah umrah melakukan pendaftaran secara online melalui WhatsApp. Bot ini menangani seluruh proses pendaftaran mulai dari pengisian data personal, validasi dokumen, hingga upload foto dokumen.

## ✨ Fitur Utama

- **Pendaftaran Interaktif**: Proses pendaftaran step-by-step yang user-friendly
- **Validasi Data**: Validasi otomatis untuk NIK, nomor paspor, dan nomor KK
- **Upload Dokumen**: Upload dan validasi foto KTP, Paspor, KK, dan Akta Kelahiran
- **Session Management**: Manajemen sesi pengguna dengan auto-reset
- **Bulk Messaging**: Pengiriman pesan massal ke multiple nomor
- **Logging**: Comprehensive logging untuk monitoring dan debugging
- **API Integration**: Terintegrasi dengan backend SIPENUH melalui REST API
- **Error Handling**: Error handling yang robust untuk pengalaman pengguna yang baik

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **WhatsApp Library**: whatsapp-web.js
- **HTTP Client**: Axios
- **Caching**: node-cache
- **Logging**: Winston
- **Scheduler**: node-cron
- **Date/Time**: Moment.js

## 📁 Struktur Project

```
SIPENUH-BOT/
├── config/              # File konfigurasi dan logs
├── controllers/         # Business logic controllers
│   ├── MessageController.js      # Handler pesan utama
│   └── BulkMessageController.js  # Handler pesan massal
├── messages/            # Template pesan bot
│   ├── menu/           # Template menu
│   └── registration/   # Template pendaftaran
├── middleware/          # Express middleware
│   └── authMiddleware.js        # Autentikasi API
├── services/            # Service layer
│   └── WhatsAppService.js       # WhatsApp client service
├── utils/               # Helper utilities
│   ├── api/            # API helpers
│   ├── errorHandler.js
│   ├── logger.js
│   └── ...
├── api.js              # API routes
├── index.js            # Entry point
└── package.json
```

## 🚀 Instalasi

### Prerequisites

- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- Akun WhatsApp untuk bot

### Langkah Instalasi

1. Clone repository
```bash
git clone https://github.com/tegarferdigantara/SIPENUH-BOT
cd SIPENUH-BOT
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```

4. Konfigurasi `.env`
```env
URL_API=<backend-api-url>
CHATBOT_API_KEY=<api-key>
WEBHOOK_PORT=3500
TIME_SESSION_RESET=30
```

5. Jalankan aplikasi
```bash
npm start
```

6. Scan QR Code yang muncul di terminal menggunakan WhatsApp

## 📝 Konfigurasi

### Environment Variables

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `URL_API` | URL backend API SIPENUH | - |
| `CHATBOT_API_KEY` | API key untuk autentikasi | - |
| `WEBHOOK_PORT` | Port untuk webhook server | 3500 |
| `TIME_SESSION_RESET` | Timeout sesi dalam menit | 30 |

## 🔌 API Endpoints

### POST /api/send-message
Mengirim pesan massal ke multiple nomor WhatsApp.

**Headers:**
```
X-API-Key: <your-api-key>
```

**Request Body:**
```json
{
  "numbers": ["628123456789", "628987654321"],
  "message": "Pesan yang akan dikirim"
}
```

### GET /api/status
Mengecek status bot (online/offline).

**Headers:**
```
X-API-Key: <your-api-key>
```

**Response:**
```json
{
  "status": "online"
}
```

## 🔄 Flow Pendaftaran

1. **Start**: User mengirim pesan pertama kali
2. **Data Personal**: Input nama, tempat/tanggal lahir, alamat
3. **Nomor Dokumen**: Input NIK, nomor paspor, nomor KK
4. **Upload Foto**: Upload foto KTP, Paspor, KK, Akta Kelahiran
5. **Verifikasi**: Sistem memverifikasi data dan foto
6. **Selesai**: Konfirmasi pendaftaran berhasil

## 📊 Logging

Bot menggunakan Winston untuk logging dengan fitur:
- Daily rotate file logs
- Separate logs untuk chatbot dan webhook
- Log levels: error, warn, info, debug
- Logs tersimpan di folder `logs/`

## 🔒 Security

- API key authentication untuk semua endpoint
- Session timeout otomatis
- Input validation dan sanitization
- Error messages yang aman (tidak expose sensitive data)

## 🐛 Debugging

Untuk debugging, check:
1. Console output di terminal
2. Log files di folder `logs/`
3. File `config/console.txt` untuk historical logs

## 👤 Author

Tegar Ferdigantara

## 🤝 Contributing

Contributions, issues, dan feature requests are welcome!

## 📞 Support

Untuk bantuan atau pertanyaan, silakan hubungi tim development.
