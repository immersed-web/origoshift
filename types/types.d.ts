export interface RoomState {
    producers: Record<string, unknown>[];
    consumers: Record<string, unknown>[];
    clients: Record<string, unknown>[];
}
export interface UserData {
    uuid: string;
    username: string;
    role: string | null;
}
export declare type UserRole = 'anonymous' | 'user' | 'admin' | 'gunnar';
//# sourceMappingURL=types.d.ts.map