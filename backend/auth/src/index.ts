import express, { json as parseJsonBody } from 'express';
import { createJwt } from './jwtUtils';


const app = express();
app.use(parseJsonBody());


const token = createJwt({gunnar: 'oledal', isccol: true, likes: ['food', 'skateboarding']}, 6000, 'asdfasdf');
console.log('token:', token);
