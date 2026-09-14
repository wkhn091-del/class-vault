# Class Vault

A shared archive of study material for one class. Anyone with the link can browse and download. One
passcode, held by you, unlocks folder creation and uploads.

```
web/     React + Vite + Tailwind      → deploy to Vercel
server/  Node + Express               → deploy to Render or Railway
         Supabase Postgres + Storage  → database and files
```

---

## How it fits together

The browser never talks to Supabase. It talks to your Express API, and the API holds the Supabase
service key. That keeps one secret in one place and means the storage bucket can stay private.

```
Browser ──► Express API ──► Supabase Postgres   (folder and file records)
                        └─► Supabase Storage    (the actual files, private bucket)
                              │
Browser ◄─────────────────────┘  short-lived signed URL, 5 minutes
```

**Reading** is open: `GET /api/folders`, `GET /api/folders/:id`, and `GET /api/files/:id/link` need
no token. **Writing** requires an `Authorization: Bearer <token>` header. That token comes from
`POST /api/auth/unlock`, which is the only place the passcode is ever checked — and it is checked on
the server with a constant-time comparison, rate limited to ten attempts per fifteen minutes.

Files are served through signed URLs that expire after five minutes. Nobody can list your bucket,
and a link copied out of the network tab stops working the same afternoon.

### API reference

| Method | Path | Who |
|---|---|---|
| `POST` | `/api/auth/unlock` | anyone, rate limited |
| `GET` | `/api/auth/session` | admin — checks a stored token is still valid |
| `GET` | `/api/folders` | anyone — list with file counts and sizes |
| `GET` | `/api/folders/:id` | anyone — one folder and its files |
| `POST` | `/api/folders` | admin |
| `PATCH` | `/api/folders/:id` | admin |
| `DELETE` | `/api/folders/:id` | admin — removes the stored files too |
| `POST` | `/api/files/folder/:folderId` | admin — multipart, field name `files`, up to 20 |
| `GET` | `/api/files/:id/link?mode=inline\|download` | anyone — returns a signed URL |
| `GET` | `/api/files/:id/open` | anyone — redirects straight to the file |
| `PATCH` | `/api/files/:id` | admin — rename |
| `DELETE` | `/api/files/:id` | admin |

### Data model

```
folders                         files
─────────────────────────       ────────────────────────────────────────
id           uuid  pk           id            uuid  pk
name         text  unique       folder_id     uuid  → folders.id, cascade
description  text  null         name          text        display name
created_at   timestamptz        storage_path  text unique key in the bucket
                                mime_type     text
                                size_bytes    bigint
                                created_at    timestamptz
```

Storage keys look like `<folderId>/<uuid>-<sanitised name>`, so two files called `notes.pdf` never
collide and a crafted filename can't escape its folder.

Row Level Security is on for both tables with read-only public policies and no write policies at
all. The API bypasses RLS via the service role. If your anon key ever leaks, the worst anyone gets
is the listing they could already see.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com). The free tier is plenty.
2. Open **SQL Editor → New query**, paste everything in `server/supabase/schema.sql`, and run it.
   That creates both tables, the RLS policies, and a private bucket called `vault`.
3. Go to **Project Settings → API** and copy two values:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key under Project API keys → `SUPABASE_SERVICE_KEY`

> The service_role key bypasses every security rule in your database. It belongs in your server's
> environment variables and nowhere else. Never put it in `web/`, and never commit it.

## 2. Run the backend

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, your `ADMIN_PASSCODE`, and a
`JWT_SECRET`. Generate a good secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then:

```bash
npm run dev        # http://localhost:4000
curl http://localhost:4000/health   # {"ok":true}
```

## 3. Run the frontend

In a second terminal:

```bash
cd web
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
```

Edit `web/.env` to set `VITE_CLASS_NAME` and `VITE_CLASS_SUBTITLE` to your class's name and a line
of your own. Click **Admin** in the header, enter your passcode, and you should be able to create a
folder and drop files into it.

---

## Deploying

### Backend on Render

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo.
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables: `ADMIN_PASSCODE`, `JWT_SECRET`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET=vault`, `MAX_FILE_MB=50`, `NODE_ENV=production`.
   Leave `CORS_ORIGINS` for now — you need the Vercel URL first.
5. Deploy, then copy the service URL, e.g. `https://class-vault-api.onrender.com`.

There's a `render.yaml` at the repo root if you'd rather use Render Blueprints — point Render at it
and it will read the service config, then prompt you for the secret values.

> Render's free tier sleeps after fifteen minutes of no traffic, so the first visit of the day takes
> about thirty seconds to wake. The paid Starter tier removes that. Railway has no sleep on its trial
> plan, which some people prefer for exactly this reason.

### Backend on Railway instead

1. **New Project → Deploy from GitHub repo**.
2. In **Settings → Root Directory**, set `server`. Railway detects Node and runs `npm start`.
3. Add the same environment variables under **Variables**.
4. Under **Settings → Networking**, click **Generate Domain** and copy it.

### Frontend on Vercel

1. **Add New → Project**, import the repo.
2. Settings:
   - **Root Directory**: `web`
   - **Framework Preset**: Vite (detected automatically)
   - **Build Command**: `npm run build`, **Output Directory**: `dist`
3. Environment variables:
   - `VITE_API_URL` → your Render or Railway URL, no trailing slash
   - `VITE_CLASS_NAME`, `VITE_CLASS_SUBTITLE`
4. Deploy and copy the resulting URL.

### Close the loop

Go back to Render or Railway and set:

```
CORS_ORIGINS=https://your-project.vercel.app
```

Redeploy the backend. Until you do this the browser will block every API call, which shows up as
"Cannot reach the server" in the interface.

If you add a custom domain later, put both origins in, comma separated:

```
CORS_ORIGINS=https://your-project.vercel.app,https://vault.yourdomain.com
```

`web/vercel.json` already rewrites all paths to `index.html`, so refreshing on `/f/<id>` works
instead of 404ing.

---

---

## Changelog — v2

**Upload failures.** The route now accepts any multipart field name, handles each file
independently (three at a time), and returns `{ uploaded, failed }` so one bad file no longer sinks
the batch. Server errors used to collapse into one generic sentence; the real Supabase message now
travels with the response. The most common cause was a missing bucket, so `ensureBucket()` runs on
boot and creates it if it isn't there.

**Hebrew filenames.** Busboy decodes filename bytes as latin1, which turns Hebrew into mojibake.
`decodeFilename()` repairs it, and only when the name actually arrived mangled. Storage keys are now
pure ASCII (`<folderId>/<uuid>.<ext>`), and downloads stream through the API with an RFC 5987
`Content-Disposition` so the real name survives.

**HTML rendering as source.** Two causes, both fixed. Server side, the content type is resolved from
the extension rather than trusting the browser's `application/octet-stream`. Client side, HTML is
fetched and handed to the iframe as `srcDoc`, which removes the response header from the equation
entirely. `previewKind()` also checks extension before MIME, so files uploaded before the fix still
render. The sandbox stays without `allow-same-origin`.

**Interface.** Hebrew RTL throughout, switchable to English from the header; direction is set on
`<html>` and layout uses logical properties (`ps`/`pe`, `start`/`end`, `rounded-ss`) so it mirrors
properly. Type is Frank Ruhl Libre over Assistant — the Hebrew book serif, not a Latin face with
Hebrew bolted on. Skeleton loaders mirror the real layout so nothing reflows when data lands.
Filenames and sizes are wrapped in `.ltr-run` so "Unit 3.pdf" doesn't render as ".pdf Unit 3".

**Roles.** Admin mode shows a brass chip plus a persistent strip under the header. Students see a
"viewing" chip and a clean gallery — no disabled buttons, no locked controls, just a key icon.

## Design notes

Folders are drawn as tabbed cards — the tab colour is derived from the folder's name, so Chemistry
always wears the same colour and you learn the drawer by sight. Files are rows rather than cards
because scanning twenty filenames is a reading task, not a browsing one. The only loud colour in the
palette is highlighter amber, spent on folder tabs and the row hover. Motion appears once on page
load and otherwise only in response to something you did; `prefers-reduced-motion` switches all of
it off.

## Previewing

Every type below opens in the preview overlay. Only genuinely opaque files (archives, installers)
fall through to a download panel.

| Type | How it opens |
|---|---|
| PDF | native browser viewer |
| Images (`png` `jpg` `gif` `webp` `avif` `svg`) | inline |
| HTML | sandboxed iframe, rendered as a page |
| Word, Excel, PowerPoint (`doc(x)` `xls(x)` `ppt(x)`) | Microsoft Office viewer, Google viewer as fallback |
| OpenDocument (`odt` `ods` `odp`) | Google viewer first, Microsoft as fallback |
| `csv`, `tsv` | parsed into a real table with a sticky header |
| Code (`sql` `py` `js` `ts` `json` `java` `cpp` and ~30 more) | syntax-highlighted, scrollable, with a copy button |
| `txt`, `md`, `log` | plain text |
| Video (`mp4` `webm` `mov`) | native HTML5 player |
| Audio (`mp3` `wav` `m4a` `flac`) | native HTML5 player |
| Archives, binaries | download panel |

### The Office viewer needs a public backend

Microsoft and Google render Office documents by fetching them **from their own servers**. That means
the URL you hand them has to be reachable from the public internet — so Office previews cannot work
while your API runs on `localhost`. The previewer detects this and says so, with a download button,
instead of showing a frame that spins forever. Once the backend is on Render or Railway they work
normally.

Both viewers are given `GET /api/files/:id/raw/file.xlsx` rather than a Supabase signed URL. Signed
URLs carry a `?token=` query string and a short clock, and both viewers handle that badly; the raw
endpoint is a clean, stable path ending in the right extension, and it keeps the bucket private
because the API is still the only thing holding the service key.

Syntax highlighting loads one grammar at a time, on demand — the main bundle carries the highlighter
core only, and `sql.js` or `python.js` arrives when a file needs it.

Uploaded HTML runs in an iframe **without** `allow-same-origin`, which puts it in an opaque origin
where it cannot read this site, your admin token, or the storage bucket. The `/raw` endpoint also
serves HTML as `text/plain`, so opening that URL directly can't execute someone's markup on the API
origin either. The trade-off is that an HTML file relying on `localStorage` won't work in the
preview — it still downloads fine.

## Managing folders

In admin mode each folder card carries a pin and a settings button, and the folder page has its own
settings button.

- **Rename** — folder settings, or `PATCH /api/folders/:id` with `name`.
- **Pin** — pinned folders sort above the rest, everywhere, for everyone. The card toggle is
  optimistic: the list reorders immediately and rolls back if the save fails.
- **Colour** — ten archival swatches, a native colour picker, or a hex value. Leave it on automatic
  and the tab colour is derived from the folder's name, so it never moves on its own. The hex format
  is checked in the route and again by a database constraint.

Run `server/supabase/migrations/002_folder_options.sql` in the Supabase SQL editor before using
these. It's safe to run more than once.

## Things worth knowing

- **Upload limit** is 50 MB per file, set by `MAX_FILE_MB`. Files pass through your server's memory
  on the way to Supabase, so on a 512 MB free instance don't raise this much past 100.
- **Supabase free tier** gives you 1 GB of storage. The home page shows your running total.
- **Changing the passcode** means editing `ADMIN_PASSCODE` and redeploying. Tokens already issued
  stay valid until they expire; shorten `SESSION_TTL` if that bothers you.
- **Deleting a folder** deletes its files from storage and from the database. There is no undo.
