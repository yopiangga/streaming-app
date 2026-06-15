import { create } from 'zustand';

const useScreenStore = create((set) => ({
  isLive: false,
  stream: null,
  status: 'Disconnected', // 'Disconnected', 'Connecting', 'Live'
  viewerCount: 0,
  socketId: null,
  hasAudio: false,

  setLive: (isLive) => set({ isLive }),
  setStream: (stream) => set({ stream }),
  setStatus: (status) => set({ status }),
  setViewerCount: (count) => set({ viewerCount: count }),
  setSocketId: (id) => set({ socketId: id }),
  setHasAudio: (hasAudio) => set({ hasAudio }),
}));

export default useScreenStore;
