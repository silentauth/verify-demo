const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const ngrok = require('ngrok')

require('dotenv').config()

const port = 8080;

async function connectNgrok() {
  let url = await ngrok.connect({
    proto: 'http',
    port: port,
  });

  console.log('Ngrok connected, URL: ' + url);
}

async function serve() {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // required for `req.ip` to be populated if behind a proxy i.e. ngrok
  app.set('trust proxy', true)

  app.use(routes())

  const server = app.listen(port, () => {
    console.log(`Verify Server app listening at http://localhost:${port}`)
    console.log('Starting Ngrok now')

    connectNgrok()
  })

  return {
    app,
    server,
  }
}

module.exports = {
  serve,
}
