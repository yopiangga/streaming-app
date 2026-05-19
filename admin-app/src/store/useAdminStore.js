import { create } from 'zustand';

const useAdminStore = create((set) => ({
  activeStreams: [], // Array of { socketId, producerId, kind, stream }
  status: 'Disconnected',
  socketId: null,

  setActiveStreams: (streams) => set({ activeStreams: streams }),
  addStream: (streamInfo) => set((state) => ({ 
    activeStreams: [...state.activeStreams, streamInfo] 
  })),
  removeStream: (socketId) => set((state) => ({ 
    activeStreams: state.activeStreams.filter(s => s.socketId !== socketId) 
  })),
  setStatus: (status) => set({ status }),
  setSocketId: (id) => set({ socketId: id }),
}));

export default useAdminStore;
