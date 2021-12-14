import express, { json as parseJsonBody } from 'express';
import cors from 'cors';
// import { createJwt } from './jwtUtils';
import createUserRouter from './userRoutes';

// console.log('environment: ', process.env);
const devMode = process.env.DEVELOPMENT;

const app = express();

if(devMode){
  console.log('allowing cors for any origin');
  app.use(cors({
    origin: ['http://localhost:8080'],
    credentials: true,
  }));
}

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
  if(process.env.DEVELOPMENT)
    console.log('Running in dev mode!!!');
});