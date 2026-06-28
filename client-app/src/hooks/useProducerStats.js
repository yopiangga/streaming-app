import { useEffect, useRef, useState } from 'react';

export const formatRate = (kbps) => {
  if (!kbps || kbps < 1) return '0 kbps';
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`;
};

/**
 * Polls the streamer's own producers (upload side) and derives live upload
 * throughput + packet loss. Reads stats WebRTC already collects — no active
 * probing — so it's cheap. Keep this in a small isolated component so a stats
 * tick never re-renders the camera preview <video>.
 *
 * @param {Array<React.MutableRefObject>} producerRefs - refs to mediasoup Producers
 */
export const useProducerStats = (producerRefs, intervalMs = 1500) => {
  const [stats, setStats] = useState(null);
  const prevRef = useRef({ bytes: 0, ts: 0 });

  useEffect(() => {
    let alive = true;
    let timer;
    prevRef.current = { bytes: 0, ts: 0 };

    const poll = async () => {
      try {
        let bytesSent = 0;
        let fps = null;
        let fractionLost = null;
        let ts = 0;

        for (const ref of producerRefs) {
          const producer = ref?.current;
          if (!producer || producer.closed) continue;
          const report = await producer.getStats();
          report.forEach((r) => {
            if (r.type === 'outbound-rtp') {
              bytesSent += r.bytesSent ?? 0;
              if (r.framesPerSecond != null) fps = r.framesPerSecond;
              if (r.timestamp) ts = Math.max(ts, r.timestamp);
            } else if (r.type === 'remote-inbound-rtp' && r.fractionLost != null) {
              // Loss reported back by the server's receiver (0..1)
              fractionLost = Math.max(fractionLost ?? 0, r.fractionLost);
            }
          });
        }

        if (alive && ts) {
          const prev = prevRef.current;
          const dt = (ts - prev.ts) / 1000;
          const kbps = prev.ts && dt > 0 ? Math.max(0, ((bytesSent - prev.bytes) * 8) / 1000 / dt) : 0;
          prevRef.current = { bytes: bytesSent, ts };
          setStats({ kbps, fps, lossPct: fractionLost != null ? fractionLost * 100 : null });
        }
      } catch {
        // transient (producer closing, etc.) — ignore
      }
      if (alive) timer = setTimeout(poll, intervalMs);
    };

    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [producerRefs, intervalMs]);

  return stats;
};
