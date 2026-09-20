import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { fmtDate, fmtAliyah } from '../../utils.js';
import type { LogEntry } from '../../types/index.js';

interface ReadingRowProps {
  r: LogEntry;
  compact?: boolean;
  actions?: React.ReactNode;
}

// Hebrew label for the aliyah number, or the special-case labels for hosafah/maftir.
function aliyahHebrewLabel(aliyah: LogEntry['aliyah']): string {
  if (aliyah === 'hosafah') return 'הוספה';
  if (Number(aliyah) === 8) return 'מפטיר';
  return `עליה ${aliyah}`;
}

// Formatted "chapter:verse–chapter:verse" range, or '' if the reading has no verse range
// (e.g. a hosafah, or incomplete data).
function verseRangeLabel(r: LogEntry): string {
  const hasVerseRange = r.aliyah !== 'hosafah'
    && (r.chapterStart ?? -1) > 0
    && (r.verseStart   ?? -1) > 0
    && (r.chapterEnd   ?? -1) > 0
    && (r.verseEnd     ?? -1) > 0;
  return hasVerseRange ? `${r.chapterStart}:${r.verseStart}–${r.chapterEnd}:${r.verseEnd}` : '';
}

export function ReadingRow({ r, compact = false, actions = null }: Readonly<ReadingRowProps>) {
  const { SEFER_MAP, TLIT } = useApp();
  const seferMeta = SEFER_MAP[r.sefer];
  const color     = seferMeta?.color ?? '#888';
  const occasion  = !r.reread && r.occasion ? ` · ${r.occasion}` : '';
  const note      = !r.reread && r.note     ? ` · ${r.note}`     : '';
  const location  = !r.reread && r.location ? ` · ${r.location}` : '';
  const bg        = r.reread ? `${color}0f` : 'transparent';
  const borderStyle = r.reread
    ? { borderLeft: `3px dashed ${color}` }
    : { borderLeftColor: color };

  const verseRangeStr = verseRangeLabel(r);
  const verseRange    = verseRangeStr && ` · ${verseRangeStr}`;
  const aliyahHebrew  = aliyahHebrewLabel(r.aliyah);

  return (
    <div className={`reading-item${actions ? ' has-actions' : ''}`} style={{ ...borderStyle, background: bg }}>
      {!compact && (
        <div className="ri-date-col">
          <div className="ri-date">{fmtDate(r.displayDate)}</div>
          <div className="ri-stat-box">
            <div>{r.pseukim} pseukim</div>
            {verseRangeStr && <div>{verseRangeStr}</div>}
          </div>
        </div>
      )}
      <div className="ri-parsha">
        <div className="ri-parsha-text">
          <div className={`hebrew heb${compact ? ' compact-heb' : ''}`}>
            {r.parsha} — {aliyahHebrew}
            {r.reread && (
              <span className="reread-badge" style={{ color, background: `${color}22` }}>
                ↺ RE-READ
              </span>
            )}
          </div>
          <div className="sub">
            {TLIT[r.parsha] ?? ''} · {fmtAliyah(r.aliyah)} · <span style={{ color }}>{seferMeta?.en ?? r.sefer}</span>{compact ? verseRange : ''}{occasion}{note}{location}
          </div>
        </div>
        {compact && (
          <div className="ri-stats">
            <span className="ri-tag">{r.pseukim} pseukim</span>
            <span className="ri-pct">{r.pct.toFixed(2)}%</span>
          </div>
        )}
        {actions && <div className="ri-footer">{actions}</div>}
      </div>
      {!compact && <div className="ri-corner"><span className="ri-pct">{r.pct.toFixed(2)}%</span></div>}
    </div>
  );
}
