module.exports = {
  apps : [{
    name   : "frontend",
    // script : "quasar serve ./dist/spa --history --port=8080",
    script : "yarn dev",
    cwd    : "./app/"
  },{
    name   : "auth",
    script : "yarn dev",
    cwd    : "./backend/auth/"
  },{
    name   : "mediaserver",
    script : "yarn dev",
    cwd    : "./backend/mediaserver/"
  }]
}