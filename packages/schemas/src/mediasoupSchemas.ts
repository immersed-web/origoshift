import { z } from "zod";
import {types as soupTypes, getSupportedRtpCapabilities} from 'mediasoup'
const UuidSchema = z.string().uuid();

// These are all the possible capabilities supported by mediasoup. Not the ones configured in the mediasoup server
// const capabilities = getSupportedRtpCapabilities();
// const extensions = capabilities.headerExtensions!
// const uriSchemaArray = extensions.map(ext => z.literal(ext.uri)) as unknown as readonly [soupTypes.RtpHeaderExtensionUri, soupTypes.RtpHeaderExtensionUri, soupTypes.RtpHeaderExtensionUri ];

export const ProducerIdSchema = UuidSchema.brand('ProducerId')
export type ProducerId = z.TypeOf<typeof ProducerIdSchema>

export const ConsumerIdSchema = UuidSchema.brand('ConsumerId')
export type ConsumerId = z.TypeOf<typeof ConsumerIdSchema>

export const TransportIdSchema = UuidSchema.brand('TransportId')
export type TransportId = z.TypeOf<typeof TransportIdSchema>


export const RtpCapabilitiesSchema = z.object({}).passthrough() satisfies z.ZodType<soupTypes.RtpCapabilities>
export type RtpCapabilities = z.TypeOf<typeof RtpCapabilitiesSchema>

// const RtpHeaderExtensionUriSchema = z.union(uriSchemaArray) satisfies z.ZodType<soupTypes.RtpHeaderExtensionUri>

const DtlsFingerprintSchema = z.object({
  value: z.string(),
  algorithm: z.string() as z.ZodType<soupTypes.FingerprintAlgorithm>
}) satisfies z.ZodType<soupTypes.DtlsFingerprint>

const DtlsParametersSchema = z.object({
  fingerprints: z.array(DtlsFingerprintSchema),
}).passthrough() satisfies z.ZodType<soupTypes.DtlsParameters>

export const ConnectTransportPayloadSchema = z.object({
  transportId: TransportIdSchema,
  dtlsParameters: DtlsParametersSchema
})

export const ProducerInfoSchema = z.object({
  // deviceId: z.string().optional(),
  isPaused: z.boolean()
})
export type ProducerInfo = z.TypeOf<typeof ProducerInfoSchema>

const MediaKindSchema = z.literal('video').or(z.literal('audio')) satisfies z.ZodType<soupTypes.MediaKind>

const RtpEncodingParameters = z.object({
  maxBitrate: z.optional(z.number())
  //There are more optionals in here but we just let them pass through for now
}).catchall(z.unknown()) satisfies z.ZodType<soupTypes.RtpEncodingParameters>


const RtpHeaderExtensionParametersSchema = z.object({
  // Ugly hack to accept any string as extensionurl
  uri: z.string() as z.ZodType<soupTypes.RtpHeaderExtensionUri>,
  id: z.number(),
  //There are more optionals in here but we just let them pass through for now
}).catchall(z.unknown()) satisfies z.ZodType<soupTypes.RtpHeaderExtensionParameters>;

const RtpCodecParametersSchema = z.object({
      clockRate: z.number(),
      mimeType: z.string(),
      payloadType: z.number(),
    }).passthrough() satisfies z.ZodType<soupTypes.RtpCodecParameters>;

const RtpParametersSchema = z.object({
  encodings: z.array(RtpEncodingParameters).optional(),
  headerExtensions: z.array(RtpHeaderExtensionParametersSchema).optional(),
  codecs: z.array(RtpCodecParametersSchema)
  }).passthrough() satisfies z.ZodType<soupTypes.RtpParameters>


export const CreateProducerPayloadSchema  = z.object({
  producerId: ProducerIdSchema.optional(),
  transportId: TransportIdSchema,
  kind: MediaKindSchema,
  rtpParameters: RtpParametersSchema,
  producerInfo: ProducerInfoSchema,
});

export type CreateProducerPayload = z.TypeOf<typeof CreateProducerPayloadSchema>

export const CreateConsumerPayloadSchema  = z.object({
  producerId: ProducerIdSchema,
});

export type CreateConsumerPayload = z.TypeOf<typeof CreateConsumerPayloadSchema>
