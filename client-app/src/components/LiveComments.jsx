import React, { useEffect, useRef, useState } from 'react';

// Mock live-chat feed: varied users/messages streaming in and scrolling up,
// TikTok-style. Purely cosmetic (no backend) — gives the stream view life.

const NAMES = [
  'andi_07', 'rizky.pratama', 'siti.nur', 'budiman', 'dewi_anggun',
  'gamerXYZ', 'nopal', 'kucing_lucu', 'mahesa', 'putri✨',
  'agus_setiawan', 'lia.maharani', 'ferry', 'zaki_99', 'intan',
  'bayu_aja', 'rara', 'om_telolet', 'cinta_99', 'dimas_p',
  'mega.w', 'arif', 'nadia', 'galih', 'wulan_dari',
];

const COLORS = [
  'text-pink-400', 'text-blue-400', 'text-yellow-400', 'text-green-400',
  'text-purple-400', 'text-orange-400', 'text-cyan-400', 'text-rose-400',
  'text-emerald-400', 'text-indigo-400', 'text-teal-400', 'text-fuchsia-400',
];

const MESSAGES = [
  'Wow keren banget! 🔥',
  'Halo dari Jakarta 👋',
  'Mantap streamnya 😍',
  'Gimana caranya kak?',
  'Salam kenal semua 🙏',
  'Suaranya jernih bgt 🎧',
  'First! 🎉',
  'Lanjut terus bang!',
  'Ngakak 🤣🤣',
  'Kapan main bareng?',
  'Cakep nih 👍',
  'Hadir kak 🙌',
  'Asli keren parah 🤯',
  'Semangat ya! 💪',
  'Love this ❤️❤️',
  'Request lagu dong 🎵',
  'Auto follow ✅',
  'Pemandangannya bagus 🏞️',
  'Bagi tips dong kak',
  'Halo bestie 💖',
  'Wkwkwk lucu 😂',
  'Keren kontennya 🤩',
  'Sehat selalu ya 🙏',
  'Adminnya baik 😇',
  'Sound on! 🔊',
  'Padet banget yang nonton 👀',
  'Gas terus jangan stop',
  'Kualitas HD nih 📸',
];

const GIFTS = [
  { emoji: '🌹', label: 'Rose' },
  { emoji: '🎁', label: 'Gift' },
  { emoji: '👑', label: 'Crown' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '💎', label: 'Diamond' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '🍩', label: 'Donut' },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const MAX_VISIBLE = 14; // older comments overflow and get clipped (scroll-up effect)

const LiveComments = () => {
  const [comments, setComments] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    let timer;
    const push = () => {
      const isGift = Math.random() < 0.15;
      const name = pick(NAMES);
      const color = pick(COLORS);
      const gift = isGift ? pick(GIFTS) : null;
      const text = isGift ? `mengirim ${gift.emoji} ${gift.label}` : pick(MESSAGES);

      idRef.current += 1;
      const id = idRef.current;
      setComments((prev) => {
        const next = [...prev, { id, name, color, text, isGift }];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });

      // Varied cadence so the feed feels organic
      timer = setTimeout(push, 650 + Math.random() * 1400);
    };

    push();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 max-h-[190px] overflow-hidden justify-end pointer-events-none">
      {comments.map((c) => (
        <div key={c.id} className="animate-comment-in flex gap-2 items-start">
          <div className="w-5 h-5 shrink-0 rounded-full bg-gradient-to-tr from-zinc-500 to-zinc-700 flex items-center justify-center text-[9px] font-bold">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-[11px] leading-snug drop-shadow">
            <span className={`font-bold ${c.color}`}>{c.name} </span>
            {c.isGift ? (
              <span className="font-semibold text-amber-300">{c.text}</span>
            ) : (
              <span className="text-white/90">{c.text}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveComments;
