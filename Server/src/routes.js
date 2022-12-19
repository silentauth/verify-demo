const { Router } = require('express')

const auth = require('./routes/auth')
const admin = require('./routes/admin')
const authUtil = require('./utils/auth')

const router = Router()

function routes() {
  router.post('/register', authUtil.verifyDevice, auth.register)
  router.post('/login', authUtil.verifyDevice, auth.login)
  router.post('/verify', authUtil.verifyDevice, auth.verify)
  router.get('/secured-page', authUtil.verifyDevice, authUtil.verifyJWT, admin.securedPage)
  router.post('/callback', auth.callback)

  router.get('/check-status', authUtil.verifyDevice, auth.getCheckStatus)

  router.get('/device', auth.device)

  return router
}

module.exports = routes