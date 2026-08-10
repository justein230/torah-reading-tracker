import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { fmtDate, fmtAliyah } from '../../utils.js';
import type { LogEntry } from '../../types/index.js';

interface ReadingRowProps {
  r: LogEntry;
  compact?: boolean;
  actions?: React.ReactNode;
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

  const hasVerseRange = r.aliyah !== 'hosafah'
    && (r.chapterStart ?? -1) > 0
    && (r.verseStart   ?? -1) > 0
    && (r.chapterEnd   ?? -1) > 0
    && (r.verseEnd     ?? -1) > 0;
  const verseRange = hasVerseRange
    ? ` · ${r.chapterStart}:${r.verseStart}–${r.chapterEnd}:${r.verseEnd}`
    : '';

  let aliyahHebrew: string;
  if      (r.aliyah === 'hosafah')    aliyahHebrew = 'הוספה';
  else if (Number(r.aliyah) === 8)    aliyahHebrew = 'מפטיר';
  else                                aliyahHebrew = `עליה ${r.aliyah}`;

  return (
    <div className={`reading-item${actions ? ' has-actions' : ''}`} style={{ ...borderStyle, background: bg }}>
      {!compact && <div className="ri-date">{fmtDate(r.displayDate)}</div>}
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
            {TLIT[r.parsha] ?? ''} · {fmtAliyah(r.aliyah)} · <span style={{ color }}>{seferMeta?.en ?? r.sefer}</span>{verseRange}{occasion}{note}{location}
          </div>
        </div>
        <div className="ri-stats">
          <span className="ri-tag">{r.pseukim} pseukim</span>
          <span className="ri-pct">{r.pct.toFixed(2)}%</span>
        </div>
      </div>
      {actions && <div className="ri-footer">{actions}</div>}
    </div>
  );
}
