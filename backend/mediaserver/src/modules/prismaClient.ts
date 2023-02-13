import { PrismaClient } from 'database';
export * from 'database';

export default new PrismaClient({errorFormat: 'pretty'});
