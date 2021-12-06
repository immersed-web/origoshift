import {PrismaClient, Prisma} from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

import prisma, {UserWithRole } from '../prismaClient';

// const clientConstructor = jest.fn();

// const actualClient = jest.requireActual('../prismaClient');
jest.mock('../prismaClient', ()=> ({
  __esModule: true,
  // default: jest.fn().mockReturnValue(mockDeep<PrismaClient>()),
  // default: clientConstructor,
  // ...actualClient,
    
  default: mockDeep<PrismaClient>(),
  Prisma
  // userDataFromDBResponse: userDataFromDBResponse,
  // UserWithRole,
  // default: jest.fn(() => ({
  //   user: {
  //     findUnique: jest.fn()
  //   }
  // }))
  // Prisma: Prisma
}));

beforeEach(() => {
  mockReset(prismaMock);
  // clientConstructor.mockImplementation(()=> mockDeep<PrismaClient>());
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
export { UserWithRole, Prisma};
// export const prismaMock: Record<string, unknown> = prisma as unknown as Record<string, unknown>;

import { PrismaSessionStore } from '@quixo3/prisma-session-store';

jest.mock('@quixo3/prisma-session-store', () => ({
  // __esModule: true,
  PrismaSessionStore: jest.fn(() => mockDeep<PrismaSessionStore>()),
}));

export const PrismaSessionStoreMock = PrismaSessionStore;