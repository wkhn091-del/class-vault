import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/github.css';

// Registered one by one rather than importing the full bundle: the whole
// library is about 900 KB, this subset is a fraction of that and still covers
// everything a class is likely to upload.
const LANGUAGES = {
  sql: () => import('highlight.js/lib/languages/sql'),
  python: () => import('highlight.js/lib/languages/python'),
  javascript: () => import('highlight.js/lib/languages/javascript'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  json: () => import('highlight.js/lib/languages/json'),
  css: () => import('highlight.js/lib/languages/css'),
  scss: () => import('highlight.js/lib/languages/scss'),
  less: () => import('highlight.js/lib/languages/less'),
  xml: () => import('highlight.js/lib/languages/xml'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  ini: () => import('highlight.js/lib/languages/ini'),
  bash: () => import('highlight.js/lib/languages/bash'),
  powershell: () => import('highlight.js/lib/languages/powershell'),
  dos: () => import('highlight.js/lib/languages/dos'),
  java: () => import('highlight.js/lib/languages/java'),
  c: () => import('highlight.js/lib/languages/c'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  php: () => import('highlight.js/lib/languages/php'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  go: () => import('highlight.js/lib/languages/go'),
  rust: () => import('highlight.js/lib/languages/rust'),
  swift: () => import('highlight.js/lib/languages/swift'),
  kotlin: () => import('highlight.js/lib/languages/kotlin'),
  r: () => import('highlight.js/lib/languages/r'),
  matlab: () => import('highlight.js/lib/languages/matlab'),
  perl: () => import('highlight.js/lib/languages/perl'),
  lua: () => import('highlight.js/lib/languages/lua'),
  dart: () => import('highlight.js/lib/languages/dart'),
  scala: () => import('highlight.js/lib/languages/scala'),
  graphql: () => import('highlight.js/lib/languages/graphql'),
  diff: () => import('highlight.js/lib/languages/diff'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  plaintext: () => import('highlight.js/lib/languages/plaintext'),
};

const loaded = new Set();

/** Loads a grammar on demand and returns highlighted HTML. */
export async function highlight(code, language) {
  const id = LANGUAGES[language] ? language : 'plaintext';

  if (!loaded.has(id)) {
    const mod = await LANGUAGES[id]();
    hljs.registerLanguage(id, mod.default);
    loaded.add(id);
  }

  try {
    return hljs.highlight(code, { language: id, ignoreIllegals: true }).value;
  } catch {
    return null; // caller falls back to plain text
  }
}
