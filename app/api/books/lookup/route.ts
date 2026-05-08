import { NextRequest, NextResponse } from "next/server";

const CACHE = { next: { revalidate: 86400 } } as const; // 24h — book metadata never changes

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get("isbn");

  if (!isbn || !/^(\d{13}|\d{10}|\d{9}[Xx])$/.test(isbn)) {
    return NextResponse.json({ error: "Invalid ISBN" }, { status: 400 });
  }

  // 1️⃣ Google Books
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
      CACHE
    );
    const json = (await res.json()) as {
      items?: { volumeInfo: { title?: string; authors?: string[]; publishedDate?: string; imageLinks?: { thumbnail?: string } } }[];
    };
    const info = json.items?.[0]?.volumeInfo;
    if (info?.title) {
      const rawThumb = info.imageLinks?.thumbnail;
      return NextResponse.json({
        title: info.title,
        authors: info.authors?.join(", ") ?? "",
        coverUrl: rawThumb ? rawThumb.replace("http://", "https://").replace("&edge=curl", "") : "",
        publishDate: info.publishedDate ?? "",
      });
    }
  } catch { /* fall through */ }

  // 2️⃣ Open Library — direct edition record
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, CACHE);
    if (res.ok) {
      const edition = (await res.json()) as { title?: string; authors?: { key: string }[]; publish_date?: string; covers?: number[] };
      if (edition.title) {
        // Resolve author names (best-effort — one extra request)
        let authors = "";
        if (edition.authors?.length) {
          try {
            const aRes = await fetch(`https://openlibrary.org${edition.authors[0].key}.json`, CACHE);
            if (aRes.ok) {
              const a = (await aRes.json()) as { name?: string };
              authors = a.name ?? "";
            }
          } catch { /* ignore */ }
        }
        return NextResponse.json({
          title: edition.title,
          authors,
          coverUrl: edition.covers?.[0] ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-M.jpg` : "",
          publishDate: edition.publish_date ?? "",
        });
      }
    }
  } catch { /* fall through */ }

  // 3️⃣ Open Library — search index (different database, broader)
  try {
    const res = await fetch(`https://openlibrary.org/search.json?isbn=${isbn}&limit=1`, CACHE);
    const json = (await res.json()) as {
      docs?: { title?: string; author_name?: string[]; first_publish_year?: number; cover_i?: number }[];
    };
    const doc = json.docs?.[0];
    if (doc?.title) {
      return NextResponse.json({
        title: doc.title,
        authors: doc.author_name?.join(", ") ?? "",
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
        publishDate: doc.first_publish_year ? String(doc.first_publish_year) : "",
      });
    }
  } catch { /* fall through */ }

  // 4️⃣ isbn-api.com — free aggregator, good Indian publisher coverage
  try {
    const res = await fetch(`https://isbn-api.com/book/${isbn}`, {
      headers: { Accept: "application/json" },
      ...CACHE,
    });
    if (res.ok) {
      const json = (await res.json()) as { title?: string; authors?: string[]; publisher?: string; year?: string; cover?: string };
      if (json.title) {
        return NextResponse.json({
          title: json.title,
          authors: json.authors?.join(", ") ?? "",
          coverUrl: json.cover ?? "",
          publishDate: json.year ?? "",
        });
      }
    }
  } catch { /* fall through */ }

  // 5️⃣ ISBNdb — strong academic / Indian publisher index
  const isbndbKey = process.env.ISBNDB_API_KEY;
  if (isbndbKey) {
    try {
      const res = await fetch(`https://api2.isbndb.com/book/${isbn}`, {
        headers: { Authorization: isbndbKey, Accept: "application/json" },
        ...CACHE,
      });
      if (res.ok) {
        const json = (await res.json()) as {
          book?: { title?: string; authors?: string[]; date_published?: string; image?: string; publisher?: string };
        };
        const book = json.book;
        if (book?.title) {
          return NextResponse.json({
            title: book.title,
            authors: book.authors?.join(", ") ?? "",
            coverUrl: book.image ?? "",
            publishDate: book.date_published ?? "",
          });
        }
      }
    } catch { /* fall through */ }
  }

  return NextResponse.json({ error: "Book not found" }, { status: 404 });
}
