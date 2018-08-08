// Based on https://github.com/wingleung/safari-push-serverside/blob/master/node_http_server.js

import dotenv from 'dotenv'
import Koa from 'koa'
import logger from 'koa-logger'
import koaBody from 'koa-body'
import send from 'koa-send'
import low from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'
import clearModule from 'clear-module'
import pem from 'pem'
import http from 'http'
import https from 'https'

import {
  PUBLIC_DIR
} from './config'

// Load `.env`
dotenv.config()

const {
  PORT
} = process.env

// Watch(file changes) and clear pages module cache on dev.
const dev = process.env.NODE_ENV !== 'production'
if (dev) {
  const watcher = require('sane')('./server')
  watcher.on('ready', () => {
    watcher.on('all', () => {
      console.log('Clearing /server module cache from server')
      clearModule.match(/server/)
    })
  })
}

const port = parseInt(PORT, 10) || 5000
const adapter = new FileAsync('db.json')

const app = new Koa()

low(adapter).then((db) => {
  app.context.db = db

  db.defaults({
    subscriptions: []
  }).write()
})

// log requests
app.use(logger())

// parse body
app.use(koaBody())

// Register pages routes/allowedMethods
if (dev) {
  // Dynamic import modules for development(With no-module-cache).
  // SEE: https://github.com/glenjamin/ultimate-hot-reloading-example/blob/master/server.js
  app.use((...args) => require('./server/routes').default.routes().apply(null, args))
  app.use((...args) => require('./server/routes').default.allowedMethods().apply(null, args))
} else {
  // Use modules statically otherwise (prod/test).
  const routes = require('./server/routes').default
  app.use(routes.routes())
  app.use(routes.allowedMethods())
}

// otherwise PUBLIC_DIR
app.use(async (ctx) => {
  await send(ctx, ctx.path, {root: PUBLIC_DIR, index: 'index.html'})
})

// Start http server.
console.log(`> Ready on http://localhost:${port}`)
http.createServer(app.callback()).listen(port)

// Start https server with self-signed certificate.
pem.createCertificate({days: 1, selfSigned: true}, function (err, keys) {
  if (err) throw err
  console.log(`> Ready on https://localhost:${port + 1}`)
  https.createServer({key: keys.serviceKey, cert: keys.certificate}, app.callback()).listen(port + 1)
})
