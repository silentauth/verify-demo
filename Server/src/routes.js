const { Router } = require('express')

const { register, login, verify, cancelVerify } = require('./routes/auth')
const { securedPage } = require('./routes/admin')
const { verifyJWT } = require('./utils/auth')

const router = Router()

function routes() {
  router.post('/register', register)
  router.post('/login', login)
  router.post('/verify', verify)
  router.post('/cancel-verify', cancelVerify)
  router.get('/secured-page', verifyJWT, securedPage)

  return router
}

module.exports = routes