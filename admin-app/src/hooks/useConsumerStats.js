import { useEffect, useRef, useState } from 'react';
import useAdminStore from '../store/useAdminStore';

// Format a throughput value (kbps) for display.
export const formatRate = (kbps) => {
  if (!kbps || kbps < 1) return '0 kbps';
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`;
};

// Pull the single inbound-rtp entry out of an RTCStatsReport (the local receive
// side; remote stats are reported under the separate 'remote-inbound-rtp' type).
const getInbound = (report) => {
  let inbound;
  report.forEach((r) => {
    if (r.type === 'inbound-rtp') inbound = r;
  });
  return inbound;
};

/**
 * Polls one mediasoup consumer's WebRTC stats and derives live throughput.
 * Reads numbers WebRTC already collects (no active probing), so it's cheap.
 * State is local to whatever tiny component calls this — keep it out of cards
 * that hold <video> so a stats tick never re-renders the video element.
 */
export const useConsumerStats = (consumer, intervalMs = 1500) => {
  const [stats, setStats] = useState(null);
  const prevRef = useRef({ bytes: 0, ts: 0, lost: 0, recv: 0 });

  useEffect(() => {
    if (!consumer) return;
    let alive = true;
    let timer;
    prevRef.current = { bytes: 0, ts: 0, lost: 0, recv: 0 };

    const poll = async () => {
      try {
        const inbound = getInbound(await consumer.getStats());
        if (inbound && alive) {
          const prev = prevRef.current;
          const ts = inbound.timestamp;
          const bytes = inbound.bytesReceived ?? 0;
          const lost = inbound.packetsLost ?? 0;
          const recv = inbound.packetsReceived ?? 0;

          const dt = (ts - prev.ts) / 1000;
          const kbps = prev.ts && dt > 0 ? Math.max(0, ((bytes - prev.bytes) * 8) / 1000 / dt) : 0;
          const dLost = lost - prev.lost;
          const dRecv = recv - prev.recv;
          const lossPct = dLost + dRecv > 0 ? Math.max(0, (dLost / (dLost + dRecv)) * 100) : 0;

          prevRef.current = { bytes, ts, lost, recv };
          setStats({ kbps, fps: inbound.framesPerSecond ?? null, lossPct });
        }
      } catch {
        // transient (e.g. consumer closing) — ignore
      }
      if (alive) timer = setTimeout(poll, intervalMs);
    };

    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [consumer, intervalMs]);

  return stats;
};

/**
 * Sums inbound throughput across every active consumer (video + audio) =
 * the admin's total live download rate. Reads activeStreams fresh each tick
 * via the store so it doesn't restart polling when streams come and go.
 */
export const useTotalBandwidth = (intervalMs = 1500) => {
  const [totalKbps, setTotalKbps] = useState(0);
  const prevRef = useRef(new Map()); // consumer.id -> { bytes, ts }

  useEffect(() => {
    let alive = true;
    let timer;

    const poll = async () => {
      const streams = useAdminStore.getState().activeStreams;
      const seen = new Set();
      let sum = 0;

      await Promise.all(
        streams.map(async (s) => {
          const c = s.consumer;
          if (!c) return;
          try {
            const inbound = getInbound(await c.getStats());
            if (!inbound) return;
            seen.add(c.id);
            const prev = prevRef.current.get(c.id);
            const ts = inbound.timestamp;
            const bytes = inbound.bytesReceived ?? 0;
            if (prev && ts > prev.ts) {
              const dt = (ts - prev.ts) / 1000;
              sum += Math.max(0, ((bytes - prev.bytes) * 8) / 1000 / dt);
            }
            prevRef.current.set(c.id, { bytes, ts });
          } catch {
            // ignore
          }
        })
      );

      // Drop consumers that have gone away
      for (const id of prevRef.current.keys()) {
        if (!seen.has(id)) prevRef.current.delete(id);
      }

      if (alive) {
        setTotalKbps(sum);
        timer = setTimeout(poll, intervalMs);
      }
    };

    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [intervalMs]);

  return totalKbps;
};
