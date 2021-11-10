import SocketWrapper, { InternalMessageType, InternalSocketType } from './SocketWrapper';
import { mock, mockDeep } from 'jest-mock-extended';

describe('socketwrapper with mocked underlying socket', () => {
  // We create a mocked send implementation that saves the outgoing "raw" data "to the side"
// Then we can use this data later as if it was received from the client
  const mockedSocket = mock<InternalSocketType>();
  let transmittedData: InternalMessageType = new ArrayBuffer(2);
  const validMsgObj: SocketMessage<UnknownMessageType> = {
    type: 'setRtpCapabilities',
    data: {},
  };
  mockedSocket.send.mockImplementation((msg, isBinary?, compress?) => {
    const enc = new TextEncoder();
    if(typeof msg === 'string'){
      const buf = enc.encode(msg);
      // console.debug('mockedSocket transmission:', buf);
      transmittedData = buf;
      return true;
    }
    return false;
  });
  it('throws away messages if not able to parse', ()=> {
    const socketWrapper = new SocketWrapper(mockedSocket);
    const messageHandler = jest.fn();
    socketWrapper.on('message', (msg) => {
      messageHandler();
    });
    socketWrapper.incomingMessage(new ArrayBuffer(10));
    expect(messageHandler).toBeCalledTimes(0);

  });

  it('emits message event when valid incoming message is triggered', ()=> {
    const socketWrapper = new SocketWrapper(mockedSocket);
    const messageHandler = jest.fn();
    socketWrapper.on('message', (msg) => {
      messageHandler();
    });
    const asString = JSON.stringify(validMsgObj);
    const enc = new TextEncoder();
    const rawMsgData = enc.encode(asString);
    socketWrapper.incomingMessage(rawMsgData);
    expect(messageHandler).toBeCalledTimes(1);

  });

  it('messages have data integrity going through the send and receive flow', () => {
    // Create an instance of the socketWrapper with a mocked socketObject inside
    const socketWrapper = new SocketWrapper(mockedSocket);
    // Send data to client (fake)
    socketWrapper.send(validMsgObj);
  
    // First set up so we listen for incoming message
    let receivedMsg;
    socketWrapper.on('message', (incomingMsg) => {
      receivedMsg = incomingMsg;
    });
    // manually trigger incoming message. In the application this would be called by
    // the ws server when it receives a socketmessage
    socketWrapper.incomingMessage(transmittedData);
    // const transmittedData = mockedSocket['transmittedData'];
    expect(receivedMsg).toEqual<SocketMessage<UnknownMessageType>>(validMsgObj);
  });
});