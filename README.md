# Rest Api ReelShort

API proxy/scraper untuk [reelshort.com](https://www.reelshort.com) — platform nonton drama China.  
Dibangun dengan **TypeScript + Express**.

## Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Node.js >= 18 |
| Framework | Express |
| HTTP Client | Axios |
| Bahasa | TypeScript |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |

## Instalasi

```bash
npm install
```

## Menjalankan

### Development (hot reload)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

Server jalan di `http://localhost:3000`.  
Dokumentasi Swagger di `http://localhost:3000/docs`.

## API Endpoints

Semua endpoint di-prefix `/api/v1/reelshort`.

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/search?keywords=...` | Step 1: Cari drama |
| GET | `/episodes/{book_id}?filtered_title=...` | Step 2: Daftar episode |
| GET | `/video/{book_id}/{episode_num}?filtered_title=...&chapter_id=...` | Step 3: URL video |
| GET | `/dramadub` | Bookshelf "Drama dengan Dub" (lengkap) |
| GET | `/newrelease` | Bookshelf "Rilis Baru" (lengkap) |
| GET | `/recommended` | Bookshelf "Lebih Direkomendasikan" (lengkap) |
| GET | `/health` | Cek status server |

### Step 1 — Pencarian

```
GET /api/v1/reelshort/search?keywords={kata_kunci}
```

Simpan `book_id` dan `filtered_title` untuk step selanjutnya.

**Response:**
```json
{
  "results": [
    {
      "book_id": "...",
      "book_title": "...",
      "filtered_title": "...",
      "book_pic": "...",
      "chapter_count": 0
    }
  ]
}
```

### Step 2 — Daftar Episode

```
GET /api/v1/reelshort/episodes/{book_id}?filtered_title={slug}
```

Simpan `episode` dan `chapter_id` untuk step selanjutnya.

**Response:**
```json
{
  "episodes": [
    { "episode": 1, "chapter_id": "..." }
  ]
}
```

### Step 3 — Video URL

```
GET /api/v1/reelshort/video/{book_id}/{episode_num}?filtered_title={slug}&chapter_id={chapter_id}
```

**Response:**
```json
{
  "video_url": "https://...",
  "episode": 1,
  "duration": 600,
  "next_episode": {
    "episode": 2,
    "chapter_id": "..."
  }
}
```

## Contoh cURL

```bash
# Step 1
curl "http://localhost:3000/api/v1/reelshort/search?keywords=drama"

# Step 2
curl "http://localhost:3000/api/v1/reelshort/episodes/BOOK_ID?filtered_title=FILTERED_TITLE"

# Step 3
curl "http://localhost:3000/api/v1/reelshort/video/BOOK_ID/1?filtered_title=FILTERED_TITLE&chapter_id=CHAPTER_ID"

# Bookshelf
curl "http://localhost:3000/api/v1/reelshort/dramadub"
```

## Response Codes

| Code | Arti |
|------|------|
| 200 | Success |
| 400 | Bad Request — parameter kurang |
| 404 | Not Found — video/bookshelf tidak ditemukan |
| 500 | Server Error |

## Struktur Proyek

```
src/
├── index.ts        # Entry point — Express + Swagger setup
├── reelshort.ts    # ReelShortAPI class (scraper logic)
├── routes.ts       # Express router definitions
└── types.ts        # TypeScript interfaces

dist/               # Hasil kompilasi (otomatis)
package.json        # Dependencies & scripts
tsconfig.json       # TypeScript config
Procfile            # Heroku: node dist/index.js
README.md
LICENSE
```

## Catatan

- **book_id** di bookshelf diperoleh otomatis dari internal search via `filtered_title`
- Bookshelf endpoint panggil search di background untuk tiap buku — jangan panggil berlebihan
- URL video format `.m3u8` (HLS streaming), perlu konversi ke `.mp4` untuk download

## Deployment (Heroku)

```bash
npm run build
git push heroku main
```

Procfile sudah diisi `web: node dist/index.js`.

## Lisensi

MIT

## ⚠️ Peringatan Hukum

Gunakan API ini **dengan bijak dan bertanggung jawab**.  
Project ini hanya untuk **tujuan edukasi dan pembelajaran**.  
Jangan gunakan untuk:

- Menyebarkan konten bajakan
- Komersialisasi ilegal
- Melanggar ToS ReelShort
- Aktivitas yang melanggar hukum di negara kamu

Segala risiko dan tanggung jawab ada di **pengguna sendiri**.
