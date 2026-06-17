import { create } from 'zustand';

const useStreamStore = create((set) => ({
  isLive: false,
  stream: null,
  status: 'Disconnected', // 'Disconnected', 'Connecting', 'Live'
  viewerCount: 0,
  socketId: null,
  facingMode: 'user',
  streamerName: '',

  setLive: (isLive) => set({ isLive }),
  setStreamerName: (name) => set({ streamerName: name }),
  setStream: (stream) => set({ stream }),
  setStatus: (status) => set({ status }),
  setViewerCount: (count) => set({ viewerCount: count }),
  setSocketId: (id) => set({ socketId: id }),
  setFacingMode: (mode) => set({ facingMode: mode }),
}));

export default useStreamStore;
