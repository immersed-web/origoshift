import SocketWrapper, { InternalSocketType } from './SocketWrapper';
// import uWebsocket from 'uWebSockets.js';
// import { mocked } from 'ts-jest/utils';
import { mock } from 'jest-mock-extended';
jest.mock('uWebSockets.js');

test('test-test', () => {
  expect(2+2).toBe(4);
});

test('converts from arraybuffer', () => {
  const enc = new TextEncoder();
  const mockedSocket = mock<InternalSocketType>();
  const msg: SocketMessage<UnknownMessageType> = {type: 'setRtpCapabilities', data: {codecs: []}};
  mockedSocket.send.mockReturnValue(true);

  const socketWrapper = new SocketWrapper(mockedSocket);

  //Fake the send functions conversion to arrayBuffer
  const buf = enc.encode(JSON.stringify(msg));

  let receivedMsg;
  socketWrapper.on('message', (msg) => {
    receivedMsg = msg;
  });
  socketWrapper.onMessage(buf);
  expect(receivedMsg).toEqual<SocketMessage<UnknownMessageType>>(msg);

});