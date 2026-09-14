/**
 * RFC 4180 parser: quoted fields, escaped quotes, embedded newlines and commas.
 * A naive split on commas mangles exactly the rows that matter — an address
 * column, or a Hebrew sentence with a comma in it.
 */
export function parseDelimited(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const source = text.replace(/^\uFEFF/, ''); // strip the BOM Excel writes

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

/** Excel writes tab-separated files under a .csv name often enough to check. */
export function guessDelimiter(text, name = '') {
  if (/\.tsv$/i.test(name)) return '\t';
  const sample = text.slice(0, 2000);
  const tabs = (sample.match(/\t/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  const semis = (sample.match(/;/g) || []).length;
  if (tabs > commas && tabs > semis) return '\t';
  if (semis > commas) return ';'; // European Excel default
  return ',';
}
