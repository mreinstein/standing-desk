#!/usr/bin/env node

'use strict'

const delay                  = require('delay')
const deskMachine            = require('./desk-machine.js')
const express                = require('express')
const fs                     = require('fs')
const register               = require('register-multicast-dns')
const safeHandler            = require('async-middleware').wrap
const serveStatic            = require('serve-static')
//const { Machine, interpret } = require('xstate');


const desk = deskMachine()

register('desk')
const app = express()

// all routes below this line are API calls and should never cache.
app.use(function (req, res, next) {
  const val = 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
  res.set('Cache-Control', val)
  res.set('Pragma', 'no-cache')
  return next()
})

app.get('/history', function (req, res) {
  if (!fs.existsSync(__dirname + '/history'))
    return res.send('')

  const history = fs.readFileSync(__dirname + '/history', 'utf8')
  res.send(history)
})

app.get('/state', safeHandler(async function (req, res) {
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  let connectionOpen = true

  req.on('close', () => { connectionOpen = false })

  const writeSSE = function ({ id, event, data }) {
    if (typeof id !== 'undefined')
      res.write(`id: ${id}\n`)

    if (event)
      res.write(`event: ${event}\n`)

    res.write(`data: ${JSON.stringify(data)}\n\n`)

    // support running within the compression middleware
    //if (res.flush)
    //res.flush()

    res.flushHeaders()
  }

  let lastHeight

  while (connectionOpen) {
  
    if (lastHeight !== desk.getState().height) {
      lastHeight = desk.getState().height
      writeSSE({ event: 'message', data: { deskState: desk.getState() }  })
    } else {
      await delay(1000); // poll every 1s for desk state update
    }
  }

  res.end()
}))


app.use(serveStatic(__dirname + '/public'))

app.post('/height', function (req, res) {
  const height = parseFloat(req.query.height)
  desk.setHeight(height)

  res.status(200).send('OK')
})

app.listen(3000)
