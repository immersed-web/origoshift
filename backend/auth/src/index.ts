import express, { json as parseJsonBody } from 'express';
// import { createJwt } from './jwtUtils';
import createUserRouter from './userRoutes';

// console.log('environment: ', process.env);


const app = express();

app.use(parseJsonBody());

const userRouter = createUserRouter(process.env);
app.use('/user', userRouter);

app.get('/health', (req, res) => {
  res.status(200).send({
    message: 'I am Healthy!'
  });
});


const port = 3333;
app.listen(port, ()=> {
  console.log(`listening on ${port}`);
});