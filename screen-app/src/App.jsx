import React, { useEffect, useRef } from 'react';
import { Monitor, MonitorOff, MonitorUp, Users, Volume2, VolumeX } from 'lucide-react';
import useScreenStore from './store/useScreenStore';
import { useScreenShare } from './hooks/useScreenShare';

function App() {
  const videoRef = useRef(null);
  const { isLive, stream, status, viewerCount, hasAudio } = useScreenStore();
  const { startStream, stopStream } = useScreenShare();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden font-sans text-white">
      {/* Screen Preview */}
      <div className="relative w-full max-w-[960px] aspect-video bg-zinc-900 overflow-hidden shadow-2xl rounded-lg border border-white/5">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
              <Monitor size={40} />
            </div>
            <p className="text-sm font-medium">Screen Preview</p>
          </div>
        )}

        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="bg-black/40 backdrop-blur-md rounded-full p-1 pl-1 pr-3 flex items-center gap-2 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold leading-tight">Screen Streamer</span>
              <span className="text-[9px] text-zinc-300 leading-tight flex items-center gap-1">
                <Users size={8} /> {viewerCount}
              </span>
            </div>
          </div>

          {isLive && (
            <div className="flex items-center gap-2">
              <span className="bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                {hasAudio ? <Volume2 size={12} /> : <VolumeX size={12} />}
                {hasAudio ? 'Audio' : 'No Audio'}
              </span>
              <span className="bg-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Center Go Live Button */}
        {!isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
            <button
              onClick={startStream}
              disabled={status === 'Connecting'}
              className="group relative flex flex-col items-center gap-4 transition-transform active:scale-95"
            >
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] group-hover:bg-indigo-500 transition-all">
                <MonitorUp size={36} />
              </div>
              <span className="text-xl font-bold tracking-wider">
                {status === 'Connecting' ? 'Connecting...' : 'SHARE SCREEN'}
              </span>
            </button>

            <div className="absolute bottom-10 w-full px-10 text-center">
              <p className="text-xs text-zinc-400">Your selected screen or window will be streamed live.</p>
            </div>
          </div>
        )}

        {/* Stop Button */}
        {isLive && (
          <div className="absolute bottom-6 right-6 z-20">
            <button
              onClick={stopStream}
              className="bg-zinc-800/80 hover:bg-red-600/80 p-3 rounded-full transition-all border border-white/10"
              title="Stop Sharing"
            >
              <MonitorOff size={24} />
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
