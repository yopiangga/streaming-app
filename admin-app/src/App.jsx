import React, { useEffect, useRef, useState } from 'react';
import { LayoutGrid, Maximize2, Shield, Signal, Video, User, Activity, MoreVertical, Search, Bell } from 'lucide-react';
import useAdminStore from './store/useAdminStore';
import { useMediasoupAdmin } from './hooks/useMediasoupAdmin';

const StreamCard = ({ streamInfo }) => {
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // useEffect(() => {
  //   console.log("Received stream info for:", streamInfo.socketId);
  //   if (videoRef.current && streamInfo.stream) {
  //     videoRef.current.srcObject = streamInfo.stream; 
  //     videoRef.current.play().catch(err => console.error("Video play failed:", err));
  //   }
  // }, [streamInfo.stream]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamInfo.stream;

    if (!video || !stream) return;

    // 🔥 Avoid unnecessary resets if stream is already attached
    if (video.srcObject === stream) return;

    console.log("Attaching stream to video element:", streamInfo.socketId);
    video.srcObject = stream;

    const handleLoaded = () => {
      video.play()
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch(err => {
          console.error("Video play failed:", err);
        });
    };

    video.onloadedmetadata = handleLoaded;

    return () => {
      video.onloadedmetadata = null;
    };
  }, [streamInfo.stream]);

  return (
    <div className={`relative group bg-zinc-900 rounded-xl overflow-hidden border border-white/5 shadow-xl transition-all hover:border-white/20 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none flex items-center justify-center bg-black' : 'aspect-video'}`}>
      {/* Video Player */}
      <video
        key={streamInfo.producerId}
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={() => setIsVideoPlaying(true)}
        className={`w-full h-full bg-black transition-opacity duration-700 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'} ${isFullscreen ? 'object-contain' : 'object-cover'}`}
      />

      {/* Loading State */}
      {!isVideoPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Connecting Stream...</span>
        </div>
      )}

      {/* Overlay Info */}
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="bg-pink-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <Signal size={10} /> LIVE
          </div>
          <span className="text-xs font-medium text-white drop-shadow-md">
            ID: {streamInfo.socketId.slice(0, 8)}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-black/40 hover:bg-white/10 rounded-md backdrop-blur-sm transition-colors text-white"
          >
            <Maximize2 size={14} />
          </button>
          <button className="p-1.5 bg-black/40 hover:bg-white/10 rounded-md backdrop-blur-sm transition-colors text-white">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
            <User size={12} className="text-zinc-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-300">Streamer Name</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">720p • 30fps</span>
          </div>
        </div>
        <Activity size={14} className="text-green-500 animate-pulse" />
      </div>

      {/* Close Fullscreen Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-red-600 rounded-full text-white z-[60] transition-colors"
        >
          <Maximize2 size={24} className="rotate-45" />
        </button>
      )}
    </div>
  );
};

// const SERVER_URL = "https://stream.mogiro.site";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3003";

function App() {
  const { activeStreams, status } = useAdminStore();
  const { consumeStream } = useMediasoupAdmin();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-white/5 hidden xl:flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">TekTok</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Monitoring System</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button className="flex items-center gap-3 p-3 bg-white/5 rounded-xl text-indigo-400">
            <LayoutGrid size={18} />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button className="flex items-center gap-3 p-3 text-zinc-500 hover:text-white transition-colors">
            <Video size={18} />
            <span className="text-sm font-medium">Recorded Streams</span>
          </button>
          <button className="flex items-center gap-3 p-3 text-zinc-500 hover:text-white transition-colors">
            <Activity size={18} />
            <span className="text-sm font-medium">System Health</span>
          </button>
        </nav>

        <div className="mt-auto bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Active Node</span>
          </div>
          <p className="text-[10px] text-zinc-500">Node-SFU: {SERVER_URL.replace('https://', '')}</p>
          <p className="text-[10px] text-zinc-500">Status: {status}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 xl:ml-64 flex flex-col p-6 md:p-10 gap-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Live Streams</h2>
            <p className="text-zinc-500 mt-1">Monitoring {activeStreams.filter(s => s.kind === 'video').length} active sessions globally.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search streams..."
                className="bg-zinc-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
              />
            </div>
            <button className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 transition-colors relative text-zinc-400">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-zinc-900"></span>
            </button>
          </div>
        </header>

        {/* Monitoring Grid */}
        {activeStreams.filter(s => s.kind === 'video').length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeStreams.filter(s => s.kind === 'video').map((stream) => (
              <StreamCard key={stream.producerId} streamInfo={stream} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-white/5 rounded-3xl gap-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600">
              <Video size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-zinc-400">No Active Streams</h3>
              <p className="text-sm text-zinc-600 max-w-[250px] mt-1">Waiting for streamers to go live. All systems are standby.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
