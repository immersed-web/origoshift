import prisma from './prismaClient';
import { RequestHandler } from 'express';

// TODO: Do we really have to check against db here?? Cant we trust that the saved sessiondata is valid?
// Basically, if there is deserialized sessiondata from the sessionstore that implies a valid user, right?
export const validateUserSession: RequestHandler = async (req, res, next) => {
  if (req.session.userId) {

    const user = await prisma.user.findUnique({ where: { uuid: req.session.userId }, include: { role: true } });
    if (user) {
      next();
      return;
    }
  }
  res.status(403).send({ message: 'fuck you!!!!' });
  return;
};