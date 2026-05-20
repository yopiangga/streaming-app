import * as mediasoup from 'mediasoup';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const config = {
  // Worker settings
  worker: {
    rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '10000', 10),
    rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '10100', 10),
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
