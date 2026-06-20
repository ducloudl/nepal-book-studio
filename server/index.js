const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3456;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'books.json');
const PUBLIC_ID_LENGTH = 8;
const PAGE_SIZE = 20;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100;          // requests per window

// ---------------------------------------------------------------------------
// LowDB setup (pure-JS JSON-file database)
// ---------------------------------------------------------------------------
let db; // lowdb instance, set during init()

async function initDB() {
  // Use dynamic import since lowdb v7 is ESM-only
  const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');

  const adapter = new JSONFile(DB_PATH);
  db = new Low(adapter, { books: [] });

  // Read existing data (or seed with default)
  await db.read();
  db.data ||= { books: [] };
  await db.write();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a short, URL-safe random ID */
function generateId(length = PUBLIC_ID_LENGTH) {
  return crypto.randomBytes(length)
    .toString('base64url')
    .slice(0, length);
}

/** Simple in-memory rate limiter */
const rateLimitStore = new Map(); // IP -> {count, windowStart}

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    rateLimitStore.set(ip, entry);
    return next();
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds: retryAfter,
    });
  }

  next();
}

// Periodically clean up stale rate-limit entries (every 5 min)
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, entry] of rateLimitStore) {
    if (entry.windowStart < cutoff) rateLimitStore.delete(ip);
  }
}, 300_000);

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(rateLimiter);

// JSON error handler — ensure all errors return JSON, not HTML
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/books
 * Create a shared book. Accepts JSON body with book data.
 * Returns the stored book with its generated ID.
 */
app.post('/api/books', async (req, res) => {
  try {
    const bookData = req.body;

    if (!bookData || typeof bookData !== 'object' || Array.isArray(bookData)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    // Generate a unique ID (retry on collision — extremely unlikely but safe)
    let id;
    const existingIds = new Set(db.data.books.map(b => b.id));
    for (let attempt = 0; attempt < 5; attempt++) {
      id = generateId();
      if (!existingIds.has(id)) break;
      id = null;
    }
    if (!id) {
      return res.status(500).json({ error: 'Failed to generate unique ID. Please try again.' });
    }

    const isPublic = bookData.isPublic !== false; // default public

    const book = {
      id,
      data: bookData,
      viewCount: 0,
      isPublic,
      createdAt: new Date().toISOString(),
    };

    db.data.books.push(book);
    await db.write();

    res.status(201).json(book);
  } catch (err) {
    console.error('POST /api/books error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/books/:id
 * Retrieve a single shared book by ID.
 * Increments the view count.
 */
app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length > 128) {
      return res.status(400).json({ error: 'Invalid book ID.' });
    }

    const book = db.data.books.find(b => b.id === id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    // Increment view count
    book.viewCount += 1;
    await db.write();

    res.json(book);
  } catch (err) {
    console.error('GET /api/books/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/books
 * List public gallery books. Paginated, 20 per page.
 * Query params: page (default 1)
 */
app.get('/api/books', (req, res) => {
  try {
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) page = 1;

    const publicBooks = db.data.books
      .filter(b => b.isPublic)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = publicBooks.length;
    const offset = (page - 1) * PAGE_SIZE;
    const books = publicBooks.slice(offset, offset + PAGE_SIZE);

    res.json({
      books,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    console.error('GET /api/books error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/books/:id/stats
 * Return view count (and basic metadata) for a book without incrementing.
 */
app.get('/api/books/:id/stats', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length > 128) {
      return res.status(400).json({ error: 'Invalid book ID.' });
    }

    const book = db.data.books.find(b => b.id === id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    res.json({
      id: book.id,
      viewCount: book.viewCount,
      isPublic: book.isPublic,
      createdAt: book.createdAt,
    });
  } catch (err) {
    console.error('GET /api/books/:id/stats error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function start() {
  await initDB();
  console.log(`📚 Database loaded from ${DB_PATH}`);

  app.listen(PORT, () => {
    console.log(`📚 Nepal Book Studio API running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app; // for testing / Vercel
