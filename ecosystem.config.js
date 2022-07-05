const dotenv = require('dotenv');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

  // let envVars;
  // if (ctx.dev) {
  //   envVars = dotenv.config({ path: '../.env.dev' }).parsed;
  // } else {
  //   envVars = dotenv.config({ path: '../.env' }).parsed;
  // }
  // console.log('envVars in quasar config:', envVars);
  const envString = fs.readFileSync(path.join(__dirname, '.env'));
  const envVars = dotenv.parse(envString);
  // console.log('envVars in pm2 config:', envVars);
  const authEnvs = _.pick(envVars, [
    'DEVELOPMENT',
    // 'AUTH_URL',
    // 'AUTH_PORT',
    // 'AUTH_PATH',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'SESSION_KEY',
  ]);
  // console.log('authenvs:', authEnvs);
  // const frontendEnvs = _.pick(envVars, [
  //   // 'SERVER_URL',
  //   'AUTH_URL',
  //   'AUTH_PORT',
  //   'AUTH_PATH',
  //   'MEDIASOUP_URL',
  //   'MEDIASOUP_PORT',
  //   'MEDIASOUP_PATH',
  // ])
module.exports = {
  apps : [
    {
      name   : "frontend",
      script : "quasar serve ./dist/spa --history --port=8080",
      // script : "yarn dev",
      cwd    : "./app/",
      // env    : frontendEnvs,
    },
    {
      name   : "auth",
      script : "yarn start",
      cwd    : "./backend/auth/",
      env: authEnvs
    },
    {
      name   : "mediaserver",
      script : "yarn start",
      cwd    : "./backend/mediaserver/",
      env: envVars
    },
    {
      name: 'caddy',
      script: "caddy run",
      cwd: "./",
      env: {
        SERVER_URL: envVars.SERVER_URL
      }
    }
  ]
}