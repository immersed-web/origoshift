import { RequestHandler } from 'express';

export const validateUserSession: RequestHandler = async (req, res, next) => {
  // if (req.session.userId) {

  //   const user = await prisma.user.findUnique({ where: { uuid: req.session.userId }, include: { role: true } });
  //   if (user) {
  //     next();
  //     return;
  //   }
  // }
  if(!req.session.userId){
    res.status(403).send({ message: 'You shall not pass!!!' });
    return;
  }
  next();
  return;
};
