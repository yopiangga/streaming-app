import React, { useEffect, useRef } from 'react';
import { Camera, Video, VideoOff, Users, MessageCircle, Share2, Heart, MoreHorizontal, X, SwitchCamera } from 'lucide-react';
import useStreamStore from './store/useStreamStore';
import { useMediasoup } from './hooks/useMediasoup';

function App() {
  const videoRef = useRef(null);
  const { isLive, stream, status, viewerCount } = useStreamStore();
  const { startStream, stopStream, switchCamera } = useMediasoup();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden font-sans text-white">
      {/* Video Background / Preview */}
      <div className="relative w-full max-w-[450px] aspect-[9/16] bg-zinc-900 overflow-hidden shadow-2xl">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
              <Camera size={40} />
            </div>
            <p className="text-sm font-medium">Camera Preview</p>
          </div>
        )}

        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex gap-2">
            <div className="bg-black/40 backdrop-blur-md rounded-full p-1 pl-1 pr-3 flex items-center gap-2 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 flex items-center justify-center text-xs font-bold">
                U
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold leading-tight">User Streamer</span>
                <span className="text-[9px] text-zinc-300 leading-tight flex items-center gap-1">
                  <Users size={8} /> {viewerCount}
                </span>
              </div>
              <button className="bg-pink-600 hover:bg-pink-700 text-[10px] font-bold px-3 py-1 rounded-full transition-colors">
                Follow
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={switchCamera}
              className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-zinc-800 transition-colors"
              title="Switch Camera"
            >
              <SwitchCamera size={18} />
            </button>
            <button className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-zinc-800 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-16 left-4 z-10">
            <span className="bg-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
        )}

        {/* Bottom Overlay Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 flex flex-col gap-4 z-10 bg-gradient-to-t from-black/80 to-transparent">
          {/* Chat Mockup */}
          <div className="flex flex-col gap-2 max-h-[150px] overflow-hidden pointer-events-none opacity-80">
             <div className="flex gap-2 items-start">
               <span className="text-[11px] font-bold text-pink-400">Viewer1:</span>
               <span className="text-[11px]">Wow, cool stream! 🔥</span>
             </div>
             <div className="flex gap-2 items-start">
               <span className="text-[11px] font-bold text-blue-400">CoolGuy:</span>
               <span className="text-[11px]">How do you do this?</span>
             </div>
             <div className="flex gap-2 items-start">
               <span className="text-[11px] font-bold text-yellow-400">Admin:</span>
               <span className="text-[11px]">Welcome to the live session!</span>
             </div>
          </div>

          <div className="flex justify-between items-end gap-4">
            <div className="flex-1">
              <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                 <span className="text-sm text-zinc-400">Say something...</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 items-center">
              <button className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-zinc-800 transition-colors">
                <Share2 size={20} />
              </button>
              <button className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-zinc-800 transition-colors">
                <Heart size={20} />
              </button>
              <button className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-zinc-800 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Center Go Live Button */}
        {!isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
            <button
              onClick={startStream}
              disabled={status === 'Connecting'}
              className="group relative flex flex-col items-center gap-4 transition-transform active:scale-95"
            >
              <div className="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(219,39,119,0.5)] group-hover:bg-pink-500 transition-all">
                <Video size={36} />
              </div>
              <span className="text-xl font-bold tracking-wider">
                {status === 'Connecting' ? 'Connecting...' : 'GO LIVE'}
              </span>
            </button>
            
            <div className="absolute bottom-20 w-full px-10 text-center">
               <p className="text-xs text-zinc-400">By going live, you agree to our Community Guidelines.</p>
            </div>
          </div>
        )}

        {/* Stop Button */}
        {isLive && (
          <div className="absolute bottom-24 right-4 z-20">
             <button
              onClick={stopStream}
              className="bg-zinc-800/80 hover:bg-red-600/80 p-3 rounded-full transition-all border border-white/10"
              title="Stop Stream"
            >
              <VideoOff size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Connection Status Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'Live' ? 'bg-green-500' : status === 'Connecting' ? 'bg-yellow-500' : 'bg-zinc-500'}`}></div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );
}

export default App;
