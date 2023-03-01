import { z } from "zod";
import type {types as soupTypes } from 'mediasoup'
const UuidSchema = z.string().uuid();

export const ProducerIdSchema = UuidSchema.brand('ProducerId')
export type ProducerId = z.infer<typeof ProducerIdSchema>

export const ConsumerIdSchema = UuidSchema.brand('ConsumerId')
export type ConsumerId = z.infer<typeof ConsumerIdSchema>

export const TransportIdSchema = UuidSchema.brand('TransportId')
export type TransportId = z.infer<typeof TransportIdSchema>

const DtlsFingerprintSchema = z.object({
  value: z.string(),
  algorithm: z.string()
}) satisfies z.ZodType<soupTypes.DtlsFingerprint>

const DtlsParametersSchema = z.object({
  fingerprints: z.array(DtlsFingerprintSchema),
}).passthrough() satisfies z.ZodType<soupTypes.DtlsParameters>

export const ConnectTransportPayloadSchema = z.object({
  transportId: TransportIdSchema,
  dtlsParameters: DtlsParametersSchema
})

const ProducerInfoSchema = z.object({
  isPaused: z.boolean()
})
type ProducerInfo = z.TypeOf<typeof ProducerInfoSchema>

const MediaKindSchema = z.literal('video').or(z.literal('audio')) satisfies z.ZodType<soupTypes.MediaKind>

const RtpEncodingParameters = z.object({
  maxBitrate: z.optional(z.number())
  //There are more optionals in here but we just let them pass through for now
}).passthrough() satisfies z.ZodType<soupTypes.RtpEncodingParameters>

const RtpHeaderExtensionParametersSchema = z.object({
  uri: z.string(),
  id: z.number(),
  //There are more optionals in here but we just let them pass through for now
}).passthrough() satisfies z.ZodType<soupTypes.RtpHeaderExtensionParameters>;

const RtpCodecParametersSchema = z.object({
      clockRate: z.number(),
      mimeType: z.string(),
      payloadType: z.number(),
    }).passthrough() satisfies z.ZodType<soupTypes.RtpCodecParameters>;

const RtpParametersSchema = z.object({
  encodings: z.array(RtpEncodingParameters),
  headerExtensions: z.array(RtpHeaderExtensionParametersSchema),
  codecs: z.array(RtpCodecParametersSchema)
  }).passthrough() satisfies z.ZodType<soupTypes.RtpParameters>


export const CreateProducerPayloadSchema  = z.object({
  transportId: TransportIdSchema,
  kind: MediaKindSchema,
  rtpParameters: RtpParametersSchema,
  producerInfo: ProducerInfoSchema,
});

export type CreateProducerPayload = z.TypeOf<typeof CreateProducerPayloadSchema>
