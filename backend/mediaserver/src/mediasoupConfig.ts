import { types as mediasoupTypes } from 'mediasoup';
// import { WorkerLogTag } from 'mediasoup/lib/Worker';
import ip from 'ip';


let publicIp = process.env.LISTEN_IP;
let listenIps: mediasoupTypes.WebRtcTransportOptions['listenIps'];

if(!publicIp){
  publicIp = '127.0.0.1';
  listenIps = [
    {
      ip: publicIp,
      announcedIp: undefined,
    }
  ];
  console.warn('WARNING! No listenIp provided to mediasoup. Defaulting to 127.0.0.1');
} else {
  listenIps = [
    {
      // ip: ip.address(),
      ip: '0.0.0.0',
      announcedIp: publicIp,
    }
  ];
  console.log('Using the following IP config for mediasoup:', listenIps);
}


const logLevel: mediasoupTypes.WorkerLogLevel = 'debug';
const logTags: mediasoupTypes.WorkerLogTag[] = [
  'info',
  'ice',
  'dtls',
  'rtp',
  'srtp',
  'rtcp',
  // 'rtx',
  // 'bwe',
  // 'score',
  'simulcast',
  'svc'
];

const router: mediasoupTypes.RouterOptions = {
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
        'x-google-start-bitrate': 1_000_000
      },
    },
    // {
    //   kind: 'video',
    //   mimeType: 'video/h264',
    //   clockRate: 90000,
    //   parameters: {
    //     'packetization-mode': 1,
    //     'profile-level-id': '4d0032',
    //     'level-asymmetry-allowed': 1,
    //     //						  'x-google-start-bitrate'  : 1000
    //   },
    // },
    // {
    //   kind: 'video',
    //   mimeType: 'video/h264',
    //   clockRate: 90000,
    //   parameters: {
    //     'packetization-mode': 1,
    //     'profile-level-id': '42e01f',
    //     'level-asymmetry-allowed': 1,
    //     //						  'x-google-start-bitrate'  : 1000
    //   },
    // },
  ],
};

const webRtcTransport: mediasoupTypes.WebRtcTransportOptions = {
  listenIps,
  // listenIps: [
  //   { ip: ip.address(), announcedIp: listenIp },
  //   // { ip: "192.168.42.68", announcedIp: null },
  //   // { ip: '10.10.23.101', announcedIp: null },
  // ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  initialAvailableOutgoingBitrate: 100_000_000,
};

export interface MediasoupConfig {
  // worker: Record<string, unknown>;
  worker: {
    rtcMinPort: number;
    rtcMaxPort: number;
    logLevel: mediasoupTypes.WorkerLogLevel;
    logTags: mediasoupTypes.WorkerLogTag[];
  },
  router: mediasoupTypes.RouterOptions;
  webRtcTransport: mediasoupTypes.WebRtcTransportOptions;
  maxIncomingBitrate: number;
  // numWorkers: number;
}

const mediasoupConfig: MediasoupConfig = {
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel,
    logTags,
  },
  router,

  // rtp listenIps are the most important thing, below. you'll need
  // to set these appropriately for your network for the demo to
  // run anywhere but on localhost
  webRtcTransport,

  // Per transport max bitrate
  maxIncomingBitrate: 50_000_000,
  // numWorkers: 1,
};

export default mediasoupConfig;
