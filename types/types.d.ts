interface RoomState {
  producers: Record<string, unknown>[],
  consumers: Record<string, unknown>[],
  clients: Record<string, unknown>[],
}

interface UserData {
  uuid: string,
  username: string,
  role: string | null,
}