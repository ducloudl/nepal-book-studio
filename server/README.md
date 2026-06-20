# Nepal Handmade Book Studio — API Server

Express.js backend providing sharing and gallery APIs for the Nepal Handmade Book Studio application.

## Quick Start

```bash
cd server
npm install
npm start
```

The server starts on **http://localhost:3456**.

## API Endpoints

| Method | Path                 | Description                            |
|--------|----------------------|----------------------------------------|
| POST   | `/api/books`         | Create a shared book                   |
| GET    | `/api/books/:id`     | Retrieve a book (increments views)     |
| GET    | `/api/books`         | List public gallery books (paginated)  |
| GET    | `/api/books/:id/stats` | Get view count (no increment)        |
| GET    | `/api/health`        | Health check                           |

### POST /api/books

Create a shared book. The book JSON can contain any structure — title, pages, theme, etc.

```bash
curl -X POST http://localhost:3456/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"My Sketchbook","pages":[{"text":"Hello world"}],"theme":"vintage"}'
```

Response (201):
```json
{
  "id": "aB3xKpQ7",
  "data": { "title": "My Sketchbook", ... },
  "viewCount": 0,
  "isPublic": true,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

Set `"isPublic": false` in the body to create a private book (excluded from gallery).

### GET /api/books/:id

Retrieve a single book. Increments the view count.

### GET /api/books

List public gallery books. Supports pagination.

Query parameters:
- `page` (default: 1) — page number, 20 books per page

Response:
```json
{
  "books": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### GET /api/books/:id/stats

Get view count without incrementing.

### Rate Limiting

All endpoints are rate-limited to **100 requests per minute per IP**. Exceeding the limit returns a 429 status.

## Tech Stack

- **Express.js** — HTTP framework
- **better-sqlite3** — Embedded SQLite database (fast, zero-config)
- **cors** — Cross-Origin Resource Sharing

## Environment Variables

| Variable  | Default              | Description          |
|-----------|----------------------|----------------------|
| `PORT`    | `3456`               | Server port          |
| `DB_PATH` | `./server/books.db`  | SQLite database path |

## Deployment (Vercel)

A `vercel.json` is included for one-click Vercel deployment. The SQLite database will use Vercel's ephemeral storage — for persistent data, switch to a hosted database or use Vercel KV/Blob.
