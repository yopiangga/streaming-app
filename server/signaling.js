import { createWebRtcTransport } from './mediasoup.js';

const rooms = new Map(); // roomName -> { router, producers: [], consumers: [] }
const peers = new Map(); // socketId -> { roomName, transport, producers: [], consumers: [] }

export const handleSignaling = (io, router) => {
  io.on('connection', (socket) => {
    console.log('Peer connected:', socket.id);

    socket.emit('connection-success', { socketId: socket.id });

    socket.on('disconnect', () => {
      console.log('Peer disconnected:', socket.id);
      // Cleanup producers and consumers for this peer
      const peer = peers.get(socket.id);
      if (peer) {
        peer.producers?.forEach(p => p.close());
        peer.consumers?.forEach(c => c.close());
        if (peer.transport) peer.transport.close();
        peers.delete(socket.id);
      }
      
      // Notify others (especially admin) about stream closing
      io.emit('stream-closed', { socketId: socket.id });
    });

    socket.on('getRouterRtpCapabilities', (callback) => {
      callback(router.rtpCapabilities);
    });

    socket.on('createWebRtcTransport', async ({ sender }, callback) => {
      try {
        const transport = await createWebRtcTransport(router);
        
        peers.set(socket.id, { 
          ...peers.get(socket.id), 
          transport 
        });

        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          }
        });
      } catch (error) {
        console.error('Error creating transport:', error);
        callback({ error: error.message });
      }
    });

    socket.on('transport-connect', async ({ dtlsParameters }) => {
      const peer = peers.get(socket.id);
      if (peer && peer.transport) {
        await peer.transport.connect({ dtlsParameters });
      }
    });

    socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
      const peer = peers.get(socket.id);
      if (peer && peer.transport) {
        const producer = await peer.transport.produce({ kind, rtpParameters, appData });
        
        peer.producers = peer.producers || [];
        peer.producers.push(producer);

        producer.on('transportclose', () => {
          console.log('producer transport closed');
          producer.close();
        });

        callback({ id: producer.id });

        // Notify admins about new stream
        io.emit('new-stream', {
          socketId: socket.id,
          producerId: producer.id,
          kind: producer.kind,
          streamerName: producer.appData?.streamerName || null,
          latitude: producer.appData?.latitude ?? null,
          longitude: producer.appData?.longitude ?? null
        });
      }
    });

    socket.on('transport-consume', async ({ rtpCapabilities, remoteProducerId }, callback) => {
      try {
        if (!router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
          return callback({ error: 'cannot consume' });
        }

        const peer = peers.get(socket.id);
        if (peer && peer.transport) {
          const consumer = await peer.transport.consume({
            producerId: remoteProducerId,
            rtpCapabilities,
            paused: true,
          });

          peer.consumers = peer.consumers || [];
          peer.consumers.push(consumer);

          consumer.on('transportclose', () => {
            consumer.close();
          });

          consumer.on('producerclose', () => {
            consumer.close();
            socket.emit('consumer-closed', { consumerId: consumer.id });
          });

          callback({
            params: {
              id: consumer.id,
              producerId: remoteProducerId,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
            }
          });
        }
      } catch (error) {
        console.error('Error consuming:', error);
        callback({ error: error.message });
      }
    });

    socket.on('consumer-resume', async ({ consumerId }) => {
      const peer = peers.get(socket.id);
      if (peer && peer.consumers) {
        const consumer = peer.consumers.find(c => c.id === consumerId);
        if (consumer) {
          await consumer.resume();
        }
      }
    });

    socket.on('get-active-streams', (callback) => {
      const activeStreams = [];
      peers.forEach((peer, socketId) => {
        if (peer.producers && peer.producers.length > 0) {
          peer.producers.forEach(p => {
            activeStreams.push({
              socketId,
              producerId: p.id,
              kind: p.kind,
              streamerName: p.appData?.streamerName || null,
              latitude: p.appData?.latitude ?? null,
              longitude: p.appData?.longitude ?? null
            });
          });
        }
      });
      callback(activeStreams);
    });
  });
};
