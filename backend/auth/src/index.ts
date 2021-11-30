import express, { json as parseJsonBody } from 'express';
import { createJwt } from './jwtUtils';
import createUserRouter from './userRoutes';

// console.log('environment: ', process.env);


const app = express();

app.use(parseJsonBody());


// const token = createJwt({ gunnar: 'oledal', isccol: true, likes: ['food', 'skateboarding'] }, 6000, 'asdfasdf');
// console.log('token:', token);

const userRouter = createUserRouter(process.env);
app.use('/user', userRouter);



app.listen(3333);