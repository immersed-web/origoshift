type PeerServerEvent =  'setRtpCapabilities' 
| 'createSendTransport' 
| 'createReceiveTransport' 
| 'connectTransport' 
| 'createProducer' 
| 'createConsumer';
type RoomServerEvent = 'getRouterRtpCapabilities';
type MediaSoupMessage = PeerServerEvent | RoomServerEvent

type MessageType = MediaSoupMessage;

interface MessageData<T, T is 'createSendTransport'> {
  keyOne: string,
}

interface socketMessage<MessageType> {
  type: MessageType,
  data: MessageData<MessageType>
}