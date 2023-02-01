import { RequestHandler } from 'express';

export const isLoggedIn: RequestHandler = async (req, res, next) => {
  if(!req.session.userId){
    res.status(403).send({ message: 'You shall not pass!!!' });
    return;
  }
  next();
  return;
};
