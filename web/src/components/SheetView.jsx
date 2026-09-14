import { useMemo } from 'react';
import { parseDelimited, guessDelimiter } from '../lib/csv.js';
import { useLocale } from '../context/LocaleContext.jsx';

const MAX_ROWS = 400;

export default function SheetView({ text, name }) {
  const { t } = useLocale();

  const { header, body, totalRows, columnCount } = useMemo(() => {
    const rows = parseDelimited(text, guessDelimiter(text, name));
    const width = rows.reduce((max, r) => Math.max(max, r.length), 0);
    return {
      header: rows[0] ?? [],
      body: rows.slice(1, MAX_ROWS + 1),
      totalRows: Math.max(rows.length - 1, 0),
      columnCount: width,
    };
  }, [text, name]);

  if (columnCount === 0) {
    return <p className="p-8 text-center text-sm text-graphite">—</p>;
  }

  return (
    <div className="h-full">
      <div className="sticky top-0 z-20 border-b border-hairline bg-raised/95 px-4 py-2 text-[13px] font-semibold text-graphite backdrop-blur">
        {t.rows(totalRows.toLocaleString())} · {t.columns(columnCount)}
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {Array.from({ length: columnCount }).map((_, i) => (
                <th
                  key={i}
                  className="sticky top-0 z-10 whitespace-nowrap border-b border-e border-hairline bg-surface px-3 py-2.5 text-start font-bold"
                >
                  {header[i] ?? ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr key={r} className="even:bg-raised/60 hover:bg-brassSoft/40">
                {Array.from({ length: columnCount }).map((_, c) => {
                  const value = row[c] ?? '';
                  const numeric = value !== '' && !Number.isNaN(Number(value.replace(/,/g, '')));
                  return (
                    <td
                      key={c}
                      className={`border-b border-e border-hairline/70 px-3 py-2 align-top ${
                        numeric ? 'tabular ltr-run text-end' : ''
                      }`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalRows > MAX_ROWS && (
        <p className="border-t border-hairline px-4 py-3 text-center text-[13px] text-mute">
          {t.truncatedRows(MAX_ROWS, totalRows.toLocaleString())}
        </p>
      )}
    </div>
  );
}
