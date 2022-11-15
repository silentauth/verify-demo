const { Router } = require('express')

const { device, register, login, verify, callback } = require('./routes/auth')
const { securedPage } = require('./routes/admin')
const { verifyJWT, verifyDevice } = require('./utils/auth')

const router = Router()

function routes() {
  router.post('/register', verifyDevice, register)
  router.post('/login', verifyDevice, login)
  router.post('/verify', verifyDevice, verify)
  router.get('/secured-page', verifyDevice, verifyJWT, securedPage)
  router.post('/callback', callback)

  router.get('/device', device)

  return router
}

module.exports = routes