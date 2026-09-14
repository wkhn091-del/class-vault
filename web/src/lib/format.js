export function formatBytes(bytes, locale = 'he') {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  const rounded = value < 10 ? value.toFixed(1) : Math.round(value);
  return `${new Intl.NumberFormat(locale).format(rounded)} ${units[i]}`;
}

export function formatDate(iso, locale = 'he') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale === 'he' ? 'he-IL' : undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeDate(iso, t, locale = 'he') {
  if (!iso) return t.nothingYet;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return t.today;
  if (days === 1) return t.yesterday;
  if (days < 30) return t.daysAgo(days);
  return formatDate(iso, locale);
}

export function extensionOf(name = '') {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(name.trim());
  return match ? match[1].toLowerCase() : '';
}

/**
 * File groups the previewer knows how to open.
 *
 * Extension is checked before the MIME type on purpose. Files uploaded from a
 * platform that reports application/octet-stream carry a useless MIME — but an
 * .xlsx is still an .xlsx. Getting this order wrong is what made HTML pages
 * render as source.
 */
const GROUPS = {
  html: ['html', 'htm'],
  pdf: ['pdf'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico'],
  video: ['mp4', 'webm', 'mov', 'm4v', 'ogv'],
  audio: ['mp3', 'wav', 'm4a', 'ogg', 'oga', 'aac', 'flac'],
  office: ['doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'odt', 'ods', 'odp'],
  sheet: ['csv', 'tsv'],
  code: [
    'sql', 'py', 'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'json', 'jsonl', 'css', 'scss', 'less',
    'xml', 'yml', 'yaml', 'toml', 'ini', 'env', 'sh', 'bash', 'zsh', 'ps1', 'bat',
    'java', 'c', 'h', 'cpp', 'cc', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'kts',
    'r', 'm', 'pl', 'lua', 'dart', 'scala', 'vue', 'svelte', 'graphql', 'ipynb', 'diff', 'patch',
  ],
  text: ['txt', 'md', 'markdown', 'rst', 'log', 'tex', 'srt', 'vtt'],
};

const MIME_FALLBACK = [
  ['html', (m) => m.includes('html')],
  ['pdf', (m) => m.includes('pdf')],
  ['image', (m) => m.startsWith('image/')],
  ['video', (m) => m.startsWith('video/')],
  ['audio', (m) => m.startsWith('audio/')],
  ['office', (m) => m.includes('officedocument') || m.includes('msword') || m.includes('ms-excel') || m.includes('ms-powerpoint') || m.includes('opendocument')],
  ['sheet', (m) => m.includes('csv') || m.includes('tab-separated')],
  ['code', (m) => m.includes('json') || m.includes('javascript') || m.includes('xml')],
  ['text', (m) => m.startsWith('text/')],
];

export function previewKind(mimeType = '', name = '') {
  const ext = extensionOf(name);
  for (const [kind, extensions] of Object.entries(GROUPS)) {
    if (extensions.includes(ext)) return kind;
  }
  const mime = String(mimeType).toLowerCase();
  for (const [kind, test] of MIME_FALLBACK) {
    if (test(mime)) return kind;
  }
  return 'none';
}

/** Which of the two web viewers a given Office file should open in first. */
export function isOfficeOpenDocument(name = '') {
  return ['odt', 'ods', 'odp'].includes(extensionOf(name));
}

/** highlight.js language id for a file extension. */
const LANGUAGES = {
  sql: 'sql', py: 'python', ipynb: 'json',
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', vue: 'xml', svelte: 'xml',
  json: 'json', jsonl: 'json', css: 'css', scss: 'scss', less: 'less',
  xml: 'xml', graphql: 'graphql', yml: 'yaml', yaml: 'yaml', toml: 'ini',
  ini: 'ini', env: 'ini', sh: 'bash', bash: 'bash', zsh: 'bash', ps1: 'powershell', bat: 'dos',
  java: 'java', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp',
  php: 'php', rb: 'ruby', go: 'go', rs: 'rust', swift: 'swift', kt: 'kotlin', kts: 'kotlin',
  r: 'r', m: 'matlab', pl: 'perl', lua: 'lua', dart: 'dart', scala: 'scala',
  diff: 'diff', patch: 'diff', md: 'markdown', markdown: 'markdown',
};

export function languageOf(name = '') {
  return LANGUAGES[extensionOf(name)] ?? 'plaintext';
}

/**
 * Archival tab colours — the muted stock of real filing tabs rather than a
 * bright spectrum. Derived from the name, so a folder always wears the same one.
 */
const TABS = [
  '#C9A227', // brass
  '#5E7F73', // sage
  '#8C5A56', // clay
  '#4E6585', // slate blue
  '#A0763F', // tan
  '#6B6A8A', // muted violet
];

export function tabColor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return TABS[hash % TABS.length];
}
