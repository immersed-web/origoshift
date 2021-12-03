import {PrismaClient} from '@prisma/client';
import { DeepMockProxy, mock, mockDeep, mockReset } from 'jest-mock-extended';

import prisma from '../prismaClient';

// const clientConstructor = jest.fn();

jest.mock('../prismaClient', ()=> ({
  __esModule: true,
  // default: jest.fn().mockReturnValue(mockDeep<PrismaClient>()),
  // default: clientConstructor,
    
  default: mockDeep<PrismaClient>(),
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
// export const prismaMock: Record<string, unknown> = prisma as unknown as Record<string, unknown>;

import { PrismaSessionStore } from '@quixo3/prisma-session-store';

jest.mock('@quixo3/prisma-session-store', () => ({
  // __esModule: true,
  PrismaSessionStore: jest.fn(() => mockDeep<PrismaSessionStore>()),
}));

export const PrismaSessionStoreMock = PrismaSessionStore;