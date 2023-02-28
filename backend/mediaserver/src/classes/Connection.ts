import { randomUUID } from 'crypto';
import { ConnectionId, ConnectionIdSchema, JwtUserData } from 'schemas';
import { BaseClient } from './InternalClasses';

interface ConnectionConstructorParams {
  connectionId?: ConnectionId
  jwtUserData: JwtUserData,
}

export class Connection {
  connectionId: ConnectionId;
  jwtUserData: JwtUserData;
  client?: BaseClient;

  constructor({connectionId = ConnectionIdSchema.parse(randomUUID()), jwtUserData}: ConnectionConstructorParams) {
    this.connectionId = connectionId;
    this.jwtUserData =jwtUserData;
    // this.client = new UserClient({connectionId, jwtUserData: {role: 'admin', userId: 'asd' as UserId, username: 'asdf'}});
  }
}
