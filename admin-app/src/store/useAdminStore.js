import { create } from 'zustand';

const useAdminStore = create((set) => ({
  activeStreams: [], // Array of { socketId, producerId, kind, stream }
  pinnedIds: [], // socketIds in pin order: first pinned shows first, etc.
  status: 'Disconnected',
  socketId: null,

  setActiveStreams: (streams) => set({ activeStreams: streams }),
  addStream: (streamInfo) => set((state) => ({
    activeStreams: [...state.activeStreams, streamInfo]
  })),
  removeStream: (socketId) => set((state) => ({
    activeStreams: state.activeStreams.filter(s => s.socketId !== socketId),
    pinnedIds: state.pinnedIds.filter(id => id !== socketId),
  })),
  // Pin appends to the end (next position); unpin removes it from the order.
  togglePin: (socketId) => set((state) => ({
    pinnedIds: state.pinnedIds.includes(socketId)
      ? state.pinnedIds.filter(id => id !== socketId)
      : [...state.pinnedIds, socketId],
  })),
  setStatus: (status) => set({ status }),
  setSocketId: (id) => set({ socketId: id }),
}));

export default useAdminStore;
