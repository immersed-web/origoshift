const dotenv = require('dotenv');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

let envString = fs.readFileSync(path.join(__dirname, '.env'));
const envVars = dotenv.parse(envString);
envVars['ENVIRONMNENT'] = 'production';
if(process.env.DEVELOPMENT){
  console.log('RUNNING IN DEV MODE');
  // envString = fs.readFileSync(path.join(__dirname, '.env.dev'));
  envVars['DEVELOPMENT'] = true;
  envVars['ENVIRONMENT'] = 'development'
}

// const authEnvs = _.pick(envVars, [
//   'DEVELOPMENT',
//   'DATABASE_URL',
//   'JWT_SECRET',
//   'JWT_ISSUER',
//   'JWT_AUDIENCE',
//   'SESSION_KEY',
// ]);

const scripts = {
  // frontend: 'quasar serve ./dist/spa --history --port=9000',
  // frontend: 'pm2 serve ./dist 5173 --spa',
  auth: "pnpm run start",
  fileserver: 'pnpm start',
  mediaserver: 'pnpm run start',
  caddy: 'caddy stop; caddy run'
}

if(envVars.DEVELOPMENT){
  console.log('using dev scripts in ecosystem file!');
  // scripts.frontend = 'pnpm run dev';
  scripts.auth = 'pnpm run dev';
  scripts.mediaserver = 'pnpm run dev';
}

module.exports = {
  apps : [
    // {
    //   name   : "frontend",
    //   script: scripts.frontend,
    //   cwd    : "./app/",
    // },
    {
      name   : "auth",
      script: scripts.auth,
      cwd    : "./backend/auth/",
      env: envVars
    },
    {
      name: 'file server',
      script: scripts.fileserver,
      cwd: './backend/fileserver/',
      env: envVars
    },
    {
      name   : "mediaserver",
      script: scripts.mediaserver,
      cwd    : "./backend/mediaserver/",
      env: envVars
    },
    {
      name: 'caddy',
      script: scripts.caddy,
      cwd: "./",
      env: envVars
    }
  ]
}
