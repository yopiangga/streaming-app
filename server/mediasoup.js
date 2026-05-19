import * as mediasoup from 'mediasoup';

const config = {
  // Worker settings
  worker: {
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
    logLevel: 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
    ],
  },
  // Router settings
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
    ],
  },
  // WebRtcTransport settings
  webRtcTransport: {
    initialAvailableOutgoingBitrate: 1000000,
    minimumAvailableOutgoingBitrate: 600000,
    maxSctpMessageSize: 262144,
  },
};

let worker;

export const createWorker = async () => {
  worker = await mediasoup.createWorker({
    logLevel: config.worker.logLevel,
    logTags: config.worker.logTags,
    rtcMinPort: config.worker.rtcMinPort,
    rtcMaxPort: config.worker.rtcMaxPort,
  });

  worker.on('died', () => {
    console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
    setTimeout(() => process.exit(1), 2000);
  });

  return worker;
};

export const createRouter = async () => {
  return await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });
};

export const createWebRtcTransport = async (router) => {
  const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1';
  const listenIp = process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0';

  const listenIps = [
    {
      ip: '127.0.0.1',
      announcedIp: '127.0.0.1',
    }
  ];

  // If the announced IP is not loopback, add it as a listener as well
  if (announcedIp !== '127.0.0.1') {
    listenIps.push({
      ip: listenIp,
      announcedIp: announcedIp,
    });
  }

  console.log('Creating WebRtcTransport with listenIps:', listenIps);

  const transport = await router.createWebRtcTransport({
    ...config.webRtcTransport,
    listenIps,
  });

  transport.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'closed') {
      transport.close();
    }
  });

  transport.on('close', () => {
    console.log('transport closed');
  });

  return transport;
};
