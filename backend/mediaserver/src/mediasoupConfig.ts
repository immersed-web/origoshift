import { types as mediasoupTypes } from 'mediasoup';
import ip from 'ip';
import { ProfileLevelId, Profile, Level, profileLevelIdToString } from 'h264-profile-level-id';

const h264_Baseline_Max_Level = profileLevelIdToString(new ProfileLevelId(Profile.Baseline, Level.L5));
const h264_ConstrainedBaseline_Max_Level = profileLevelIdToString(new ProfileLevelId(Profile.ConstrainedBaseline, Level.L5));

// This one seems to allow hardware accelerated encoding on the sender side (on the laptops I've tried) 🚀
const h264_Main_Level52 = profileLevelIdToString(new ProfileLevelId(Profile.Main, Level.L5_2));

let publicIp = process.env.LISTEN_IP;
let internalIp = process.env.INTERNAL_IP;
let listenIps: mediasoupTypes.WebRtcTransportOptions['listenIps'];

if(!internalIp){
  internalIp = ip.address();
}

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
      ip: internalIp,
      announcedIp: publicIp,
    },
    {
      ip: internalIp,
      announcedIp: internalIp,
    }
  ];
}
console.log('Using the following IP config for mediasoup:', listenIps);


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
    // NOTE: Make sure to try the chosen codecs with different headsets.
    // ALSO! Check so the sender side cropping wont crash with the codec config you pick!
    {
      kind: 'video',
      mimeType: 'video/h264',
      clockRate: 90000,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': h264_Main_Level52, // At least Quest 3 supports this. Should check quest 2 and 1 too.
        'level-assymetry-allowed': 1

      }
    },
    // {
    //   kind: 'video',
    //   mimeType: 'video/VP8',
    //   clockRate: 90000,
    //   parameters: {
    //     'x-google-start-bitrate': 1_000_000
    //   },
    // },
    // {
    //   kind       : 'video',
    //   mimeType   : 'video/h264',
    //   clockRate  : 90000,
    //   parameters :
    //   {
    //     'packetization-mode'      : 1,
    //     'profile-level-id'        : '42001f', //Hardware encoder
    //     'level-asymmetry-allowed' : 1
    //   }
    // },
    // {
    //   kind: 'video',
    //   mimeType: 'video/h264',
    //   clockRate: 90000,
    //   parameters: {
    //     'packetization-mode': 1,
    //     'profile-level-id': '4d0032',
    //     'level-asymmetry-allowed': 1,
    //     //						  'x-google-start-bitrate'  : 1_000_000
    //   },
    // },
    // {
    //   kind: 'video',
    //   mimeType: 'video/h264',
    //   clockRate: 90000,
    //   parameters: {
    //     'packetization-mode': 1,
    //     'profile-level-id': '42e01f', // OpenH264
    //     'level-asymmetry-allowed': 1,
    //     //						  'x-google-start-bitrate'  : 1_000_000
    //   },
    // },
  ],
};

const webRtcTransport: mediasoupTypes.WebRtcTransportOptions = {
  listenIps,
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
  /**
   * max bitrate allowed per transport
   */
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
