const dotenv = require('dotenv');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

let envString = fs.readFileSync(path.join(__dirname, '.env'));
if(process.env.DEVELOPMENT){
  envString = fs.readFileSync(path.join(__dirname, '.env.dev'));
}
const envVars = dotenv.parse(envString);
const authEnvs = _.pick(envVars, [
  'DEVELOPMENT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_ISSUER',
  'JWT_AUDIENCE',
  'SESSION_KEY',
]);

const scripts = {
  frontend: 'quasar serve ./dist/spa --history --port=8080',
  auth: "yarn start",
  mediaserver: 'yarn start',
  caddy: 'caddy stop; caddy run'
}

if(envVars.DEVELOPMENT){
  console.log('using dev scripts in ecosystem file!');
  scripts.frontend = 'yarn dev';
  scripts.auth = 'yarn dev';
  scripts.mediaserver = 'yarn dev';
}

module.exports = {
  apps : [
    {
      name   : "frontend",
      // script : "quasar serve ./dist/spa --history --port=8080",
      // script : "yarn dev",
      script: scripts.frontend,
      cwd    : "./app/",
      // env    : frontendEnvs,
    },
    {
      name   : "auth",
      // script : "yarn start",
      script: scripts.auth,
      cwd    : "./backend/auth/",
      env: authEnvs
    },
    {
      name   : "mediaserver",
      // script : "yarn start",
      script: scripts.mediaserver,
      cwd    : "./backend/mediaserver/",
      env: envVars
    },
    {
      name: 'caddy',
      // script: "caddy run",
      script: scripts.caddy,
      cwd: "./",
      env: {
        SERVER_URL: envVars.SERVER_URL
      }
    }
  ]
}