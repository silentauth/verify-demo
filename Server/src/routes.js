const { Router } = require('express')

const { device, register, login, verify, cancelVerify } = require('./routes/auth')
const { securedPage } = require('./routes/admin')
const { verifyJWT, verifyDevice } = require('./utils/auth')

const router = Router()

function routes() {
  router.post('/register', verifyDevice, register)
  router.post('/login', verifyDevice, login)
  router.post('/verify', verifyDevice, verify)
  router.patch('/cancel-verify', cancelVerify)
  router.get('/secured-page', verifyDevice, verifyJWT, securedPage)

  router.get('/device', device)

  return router
}

module.exports = routes