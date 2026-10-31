/**
 * Browsers lie about MIME types. Drag-and-drop on some platforms reports
 * application/octet-stream for everything, and Supabase stores whatever we
 * send — so an .html saved as octet-stream comes back as a download prompt or
 * raw source instead of a rendered page. We resolve the type ourselves.
 */
const BY_EXTENSION = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  json: 'application/json; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  bmp: 'image/bmp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
};

const USELESS = new Set(['', 'application/octet-stream', 'binary/octet-stream', 'content/unknown']);

export function extensionOf(name = '') {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(name.trim());
  return match ? match[1].toLowerCase() : '';
}

/** Extension wins for the types we care about rendering; browser hint fills the gaps. */
export function resolveContentType(name, browserHint = '') {
  const known = BY_EXTENSION[extensionOf(name)];
  if (known) return known;
  const hint = String(browserHint).toLowerCase().trim();
  return USELESS.has(hint) ? 'application/octet-stream' : browserHint;
}
