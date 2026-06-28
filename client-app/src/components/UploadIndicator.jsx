import React, { useMemo } from 'react';
import { useProducerStats, formatRate } from '../hooks/useProducerStats';

// Map throughput/loss to a 0-4 signal strength. Loss is the better health signal
// for a sender; fall back to bitrate before the first server loss report arrives.
const computeLevel = ({ kbps, lossPct }) => {
  if (!kbps) return 0;
  if (lossPct != null) {
    if (lossPct < 1) return 4;
    if (lossPct < 3) return 3;
    if (lossPct < 8) return 2;
    return 1;
  }
  if (kbps > 800) return 4;
  if (kbps > 400) return 3;
  if (kbps > 150) return 2;
  return 1;
};

const LABELS = ['No signal', 'Buruk', 'Cukup', 'Bagus', 'Sangat bagus'];
const BAR_COLORS = ['bg-white/25', 'bg-red-400', 'bg-amber-400', 'bg-green-400', 'bg-emerald-400'];

const UploadIndicator = ({ videoRef, audioRef }) => {
  const refs = useMemo(() => [videoRef, audioRef], [videoRef, audioRef]);
  const stats = useProducerStats(refs);

  const level = stats ? computeLevel(stats) : 0;
  const barColor = BAR_COLORS[level];
  const title = stats
    ? `${LABELS[level]} · upload ${formatRate(stats.kbps)}${stats.lossPct != null ? ` · loss ${stats.lossPct.toFixed(1)}%` : ''}`
    : 'Mengukur koneksi...';

  return (
    <div
      title={title}
      className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1"
    >
      <div className="flex items-end gap-0.5 h-3.5">
        {[1, 2, 3, 4].map((b) => (
          <span
            key={b}
            className={`w-1 rounded-sm transition-colors ${b <= level ? barColor : 'bg-white/25'}`}
            style={{ height: `${b * 25}%` }}
          />
        ))}
      </div>
      <span className="text-[10px] font-semibold text-white tabular-nums">
        {stats ? formatRate(stats.kbps) : '—'}
      </span>
    </div>
  );
};

export default UploadIndicator;
