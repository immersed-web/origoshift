interface RoomState {
  producers: Record<string, unknown>[],
  consumers: Record<string, unknown>[],
  clients: Record<string, unknown>[],
}